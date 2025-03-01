interface CatalogPublishedData {
  userName: string
  brandName: string
  catalogName: string
  catalogCode: string
}

export function catalogPublishedTemplate(data: CatalogPublishedData) {
  const html = `
    <div>
      <h2>Hello ${data.userName},</h2>
      <p>A new catalog is available for ${data.brandName}.</p>
      <p>Catalog details:</p>
      <ul>
        <li>Name: ${data.catalogName || 'N/A'}</li>
        <li>Code: ${data.catalogCode}</li>
      </ul>
      <p>You can view it in your dashboard.</p>
    </div>
  `

  const text = `
    Hello ${data.userName},
    
    A new catalog is available for ${data.brandName}.
    
    Catalog details:
    - Name: ${data.catalogName || 'N/A'}
    - Code: ${data.catalogCode}
    
    You can view it in your dashboard.
  `

  return { html, text }
}