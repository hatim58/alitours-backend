const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    // If using Cloudflare R2, pass the endpoint
    endpoint: process.env.S3_ENDPOINT ? process.env.S3_ENDPOINT : undefined,
});

/**
 * Upload a generated PDF buffer to S3 / R2
 * @param {Buffer} fileBuffer
 * @param {String} fileNamePrefix
 * @returns {String} URL of the uploaded file
 */
const uploadPdf = async (fileBuffer, fileNamePrefix = 'document') => {
    const fileName = `${fileNamePrefix}-${uuidv4()}.pdf`;
    const bucketName = process.env.S3_BUCKET_NAME;

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: 'application/pdf',
        // Depending on your S3 config, you may want 'public-read' setup via bucket policies
        // ACL: 'public-read', // Deprecated in newer setups but sometimes requested
    };

    const command = new PutObjectCommand(params);

    try {
        await s3Client.send(command);

        // Compute the public URL
        // Useful for standard S3
        let url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        // Adjust if using R2 custom domain or explicit endpoint
        if (process.env.S3_ENDPOINT) {
            // Very basic URL construction for R2 / custom endpoints. Needs adjustment based on actual domain.
            url = `${process.env.S3_ENDPOINT}/${bucketName}/${fileName}`;
        }

        return url;
    } catch (error) {
        console.error('S3 Upload Error:', error);
        throw new Error('Failed to upload PDF');
    }
};

module.exports = { uploadPdf };
