// This file acts as a manifest for certificate background images.
// To add a new image, place it in the /public folder and add its path to this list.

const certificateImages: string[] = [];

for (let i = 0; i <= 50; i++) {
    certificateImages.push(`/brandsoft-cert${i}.jpg`);
}

export default certificateImages;
