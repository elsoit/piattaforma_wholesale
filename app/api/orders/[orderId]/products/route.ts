import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const orderIdNum = parseInt(orderId);

    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: 'ID ordine non valido' },
        { status: 400 }
      )
    }

    // 1. Carica i prodotti dell'ordine con i loro dettagli
    const { rows: orderProducts } = await db.query(`
      SELECT 
        op.*,
        p.article_code,
        p.variant_code,
        p.size_id,
        p.size_group_id,
        p.brand_id,
        p.wholesale_price,
        sg.name as size_group_name
      FROM order_products op
      JOIN products p ON p.id = op.product_id
      LEFT JOIN size_groups sg ON sg.id = p.size_group_id
      WHERE op.order_id = $1
    `, [orderIdNum])

    // 2. Estrai combinazioni uniche (brand, article_code, variant_code)
    const uniqueCombinations = orderProducts.reduce((acc: any[], op) => {
      const key = `${op.brand_id}-${op.article_code}-${op.variant_code}`;
      if (!acc.find(c => c.key === key)) {
        acc.push({
          key,
          brand_id: op.brand_id,
          article_code: op.article_code,
          variant_code: op.variant_code,
          size_group_id: op.size_group_id,
          size_group_name: op.size_group_name,
          wholesale_price: op.wholesale_price
        });
      }
      return acc;
    }, []);

    console.log('Unique combinations:', uniqueCombinations);

    // 3. Per ogni combinazione, cerca tutti i prodotti con le taglie
    const lines = await Promise.all(uniqueCombinations.map(async (combo) => {
      // Cerca tutti i prodotti per questa combinazione
      const { rows: products } = await db.query(`
        SELECT 
          p.*,
          s.name as size_name,
          s.id as size_id,
          sg.id as size_group_id,
          sg.name as size_group_name
        FROM products p
        LEFT JOIN sizes s ON s.id = p.size_id
        LEFT JOIN size_groups sg ON sg.id = p.size_group_id
        WHERE p.brand_id = $1 
        AND TRANSLATE(UPPER(p.article_code), '-./'' ', '') = TRANSLATE(UPPER($2), '-./'' ', '')
        AND p.variant_code = $3
        ORDER BY s.name
      `, [combo.brand_id, combo.article_code, combo.variant_code]);

      // Crea l'array sizes_quantities con le quantità dall'ordine
      const sizes_quantities = products.map(p => {
        const orderProduct = orderProducts.find(op => op.product_id === p.id);
        console.log('Product mapping:', {
          product_id: p.id,
          size_id: p.size_id,
          size_name: p.size_name,
          order_product: orderProduct ? {
            id: orderProduct.id,
            quantity: orderProduct.quantity
          } : null
        });
        
        return {
          size_id: p.size_id,
          size_name: p.size_name,
          quantity: orderProduct?.quantity || 0
        };
      });

      console.log('Detailed sizes_quantities:', JSON.stringify(sizes_quantities, null, 2));

      // Prendi il size_group_id dal primo prodotto (sarà lo stesso per tutti)
      const size_group_id = products[0]?.size_group_id;
      const size_group_name = products[0]?.size_group_name;

      const line = {
        article_code: combo.article_code,
        variant_code: combo.variant_code,
        size_group_id,
        size_group_name,
        price: combo.wholesale_price,
        sizes_quantities
      };

      console.log('Final line with detailed sizes:', JSON.stringify(line, null, 2));
      return line;
    }));

    console.log('All lines with details:', JSON.stringify(lines, null, 2));

    return NextResponse.json({ lines })

  } catch (error) {
    console.error('Errore nel caricamento dei prodotti:', error)
    return NextResponse.json(
      { error: 'Errore nel caricamento dei prodotti' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const orderIdNum = parseInt(orderId);

    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: 'ID ordine non valido' },
        { status: 400 }
      )
    }

    const { products } = await request.json()

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Nessun prodotto da salvare' },
        { status: 400 }
      )
    }

    await db.query('BEGIN')

    try {
      // Prima cancella tutte le righe esistenti per questo ordine
      await db.query(
        'DELETE FROM order_products WHERE order_id = $1',
        [orderIdNum]
      )

      // Per ogni prodotto, verifica se esiste e ottieni/crea l'ID
      const productsWithIds = [];
      
      for (const product of products) {
        // Validazione dei dati
        if (!product.article_code || !product.variant_code || !product.size_id || !product.size_group_id || !product.brand_id) {
          console.error('Dati prodotto incompleti:', product);
          continue;
        }

        try {
          // Verifica se il prodotto esiste
          const { rows: existing } = await db.query(
            `SELECT id FROM products 
             WHERE article_code = $1 
             AND variant_code = $2 
             AND size_id = $3 
             AND brand_id = $4`,
            [product.article_code, product.variant_code, product.size_id, product.brand_id]
          )

          let productId;
          
          if (existing.length > 0) {
            // Usa il prodotto esistente
            productId = existing[0].id;
            console.log('Prodotto esistente trovato:', productId);
          } else {
            // Crea un nuovo prodotto
            const { rows: [newProduct] } = await db.query(
              `INSERT INTO products (
                article_code, variant_code, size_id, size_group_id,
                brand_id, wholesale_price, retail_price, status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING id`,
              [
                product.article_code,
                product.variant_code,
                product.size_id,
                product.size_group_id,
                product.brand_id,
                product.price,
                null,
                'active'
              ]
            )
            productId = newProduct.id;
            console.log('Nuovo prodotto creato:', productId);
          }

          // Aggiungi all'array solo se la quantità è > 0
          if (product.quantity > 0) {
            productsWithIds.push({
              product_id: productId,
              quantity: product.quantity,
              price: product.price
            });
          }
        } catch (error) {
          console.error('Errore nel processare il prodotto:', product, error);
          throw new Error(`Errore nel processare il prodotto ${product.article_code} - ${product.variant_code}`);
        }
      }

      // Ora inserisci tutte le righe usando i product_id ottenuti
      if (productsWithIds.length > 0) {
        const queryParams = [];
        const placeholders = productsWithIds.map((_, index) => {
          const offset = index * 4;
          queryParams.push(
            orderIdNum,
            productsWithIds[index].product_id,
            productsWithIds[index].quantity,
            productsWithIds[index].price
          );
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
        }).join(',');

        const result = await db.query(`
          INSERT INTO order_products (order_id, product_id, quantity, price)
          VALUES ${placeholders}
          RETURNING *
        `, queryParams);

        await db.query('COMMIT')

        return NextResponse.json({
          message: 'Prodotti salvati con successo',
          saved: result.rows
        })
      } else {
        await db.query('COMMIT')
        return NextResponse.json({
          message: 'Nessuna riga da salvare (tutte le quantità sono zero)',
          saved: []
        })
      }
    } catch (error) {
      await db.query('ROLLBACK')
      console.error('Errore nel salvataggio dei prodotti:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Errore nel salvataggio dei prodotti' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Errore nel salvataggio dei prodotti:', error)
    return NextResponse.json(
      { error: 'Errore nel salvataggio dei prodotti' },
      { status: 500 }
    )
  }
}
