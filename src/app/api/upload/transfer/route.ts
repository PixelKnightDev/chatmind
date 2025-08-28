// app/api/upload/transfer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const { uploadcareUrl, fileName, fileSize, mimeType, uploadcareUuid } = await request.json()

    if (!uploadcareUrl) {
      return NextResponse.json(
        { error: 'Uploadcare URL is required' },
        { status: 400 }
      )
    }

    console.log('Transferring file from Uploadcare to Cloudinary:', fileName)

    // Upload to Cloudinary from Uploadcare URL
    const result = await cloudinary.uploader.upload(uploadcareUrl, {
      resource_type: 'auto',
      public_id: `chatgpt-clone/${Date.now()}-${fileName}`,
      folder: 'chatgpt-clone',
      // Add metadata
      context: {
        uploadcare_uuid: uploadcareUuid,
        original_name: fileName,
        upload_source: 'uploadcare'
      }
    })

    // Optionally delete from Uploadcare after successful transfer
    // You can implement this if you want to clean up Uploadcare storage
    // await deleteFromUploadcare(uploadcareUuid)

    const file = {
      originalName: fileName,
      size: fileSize,
      type: mimeType,
      url: result.secure_url,
      publicId: result.public_id,
      uploadcareUuid: uploadcareUuid
    }

    return NextResponse.json({
      message: 'File transferred successfully',
      file: file
    })

  } catch (error: unknown) {
    console.error('Transfer error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      {
        error: 'Failed to transfer file',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// Optional: Delete from Uploadcare after transfer (currently unused but kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function deleteFromUploadcare(uuid: string) {
  try {
    const response = await fetch(`https://api.uploadcare.com/files/${uuid}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Uploadcare.Simple ${process.env.UPLOADCARE_PUBLIC_KEY}:${process.env.UPLOADCARE_SECRET_KEY}`
      }
    })

    if (response.ok) {
      console.log('File deleted from Uploadcare:', uuid)
    }
  } catch (error) {
    console.warn('Failed to delete from Uploadcare:', error)
  }
}