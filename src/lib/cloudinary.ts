import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload file to Cloudinary
 */
export async function uploadToCloudinary(fileBuffer: Buffer, fileName: string) {
  console.log(`Starting Cloudinary upload for: ${fileName}`)
  
  // Check if config is loaded
  const config = cloudinary.config()
  console.log('Cloudinary config loaded:', {
    cloud_name: !!config.cloud_name,
    api_key: !!config.api_key,
    api_secret: !!config.api_secret,
  })
  
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    throw new Error('Cloudinary configuration is missing. Please check your environment variables.')
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: `chatgpt-clone/${Date.now()}-${fileName}`,
        folder: 'chatgpt-clone',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(error)
        } else {
          console.log('Cloudinary upload success:', result?.public_id)
          resolve(result)
        }
      }
    ).end(fileBuffer)
  })
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    throw error
  }
}