// Dynamically import all possible invoice/quote images
const imageModules = import.meta.glob('./inv-and-quots*.{png,jpg,jpeg,svg,webp}', { eager: true, as: 'url' });

const invoiceAndQuoteImages: { name: string; src: string }[] = Object.entries(imageModules).map(([path, src]) => {
  const fileName = path.replace('./', '');
  return {
    name: fileName,
    src: src,
  };
});

export default invoiceAndQuoteImages;
