const fs = require('fs');

const data = JSON.parse(fs.readFileSync('d:/FREELANCING/AlvavShopify/vibecrafts.com_20260707_063133_4e6cbdd9aeed.json', 'utf8'));

// Shopify CSV headers
const headers = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 'Option3 Name', 'Option3 Value',
  'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty', 
  'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 
  'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable', 
  'Variant Barcode', 'Image Src', 'Image Position', 'Image Alt Text', 
  'Gift Card', 'SEO Title', 'SEO Description', 'Variant Weight Unit'
];

function escapeCSV(str) {
  if (str === null || str === undefined) return '';
  str = String(str);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const writeStream = fs.createWriteStream('d:/FREELANCING/AlvavShopify/shopify_products_import.csv');
writeStream.write(headers.map(escapeCSV).join(',') + '\n');

const products = data.products || [];

for (const p of products) {
  const handle = p.handle;
  const title = p.title;
  const body = p.description || p.body_html || '';
  const vendor = p.vendor || '';
  const type = p.product_type || '';
  
  // Combine tags and collections as tags so Automated Collections can pick them up
  let allTags = [...(p.tags || [])];
  if (p.collections && Array.isArray(p.collections)) {
    allTags.push(...p.collections);
  }
  const tags = allTags.join(', ');
  
  const published = p.published_at ? 'TRUE' : 'FALSE';
  const seo_title = p.seo_title || '';
  const seo_description = p.seo_description || '';

  const variants = p.variants || [{}];
  const images = p.images || [];

  // Determine max rows needed for this product (max of variants vs images)
  const rowsCount = Math.max(variants.length, images.length, 1);

  for (let i = 0; i < rowsCount; i++) {
    const v = variants[i] || null;
    const img = images[i] || null;

    let row = [];
    
    // Base product info only on the first row
    if (i === 0) {
      row.push(
        handle, title, body, vendor, type, tags, published
      );
    } else {
      row.push(handle, '', '', '', '', '', '');
    }

    // Variant info
    if (v) {
      row.push(
        p.options?.[0]?.name || 'Title', v.option_values?.[0]?.value || 'Default Title',
        p.options?.[1]?.name || '', v.option_values?.[1]?.value || '',
        p.options?.[2]?.name || '', v.option_values?.[2]?.value || '',
        v.sku || '',
        v.weight || '',
        'shopify', // Inventory Tracker
        v.inventory_quantity !== null && v.inventory_quantity !== undefined ? v.inventory_quantity : 100,
        v.inventory_policy || 'deny', // Inventory Policy
        'manual', // Fulfillment Service
        v.price !== null ? v.price : '', // Price
        v.compare_at_price !== null ? v.compare_at_price : '', // Compare At Price
        v.requires_shipping !== false ? 'TRUE' : 'FALSE', // Requires Shipping
        v.taxable !== false ? 'TRUE' : 'FALSE', // Taxable
        v.barcode || '' // Barcode
      );
    } else {
      // Empty variant columns
      for(let j=0; j<17; j++) row.push('');
    }

    // Image info
    if (img) {
      row.push(
        img.src || img.original_url || '',
        img.position || (i + 1),
        img.alt || ''
      );
    } else {
      // Empty image columns
      row.push('', '', '');
    }

    // Extra columns on first row only
    if (i === 0) {
      row.push(
        p.gift_card ? 'TRUE' : 'FALSE',
        seo_title,
        seo_description,
        v?.weight_unit || 'kg'
      );
    } else {
      row.push('', '', '', '');
    }

    writeStream.write(row.map(escapeCSV).join(',') + '\n');
  }
}

writeStream.end();
writeStream.on('finish', () => {
  console.log('CSV successfully generated with ' + products.length + ' products.');
});
