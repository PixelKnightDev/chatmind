import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called')
    
    // Check environment variables
    console.log('Cloudinary config check:', {
      cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_secret: !!process.env.CLOUDINARY_API_SECRET,
    })

    const data = await request.formData()
    const files: File[] = data.getAll('files') as unknown as File[]
    
    console.log('Files received:', files.length)
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files received' },
        { status: 400 }
      )
    }

    const uploadResults = []

    for (const file of files) {
      console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`)
      
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      try {
        // Upload to Cloudinary
        console.log(`Uploading ${file.name} to Cloudinary...`)
        const result = await uploadToCloudinary(buffer, file.name)
        console.log(`Successfully uploaded ${file.name}`)
        
        uploadResults.push({
          originalName: file.name,
          size: file.size,
          type: file.type,
          url: (result as any).secure_url,
          publicId: (result as any).public_id,
        })
      } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
          { 
            error: `Failed to upload file: ${file.name}`,
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
    }

    console.log('All files uploaded successfully')
    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: uploadResults,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}