import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// Configure route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Handle multiple images with 'images' key or single file with 'file' key
    const files = formData.getAll('images') as File[]
    const singleFile = formData.get('file') as File
    
    const filesToUpload = files.length > 0 ? files : (singleFile ? [singleFile] : [])
    
    if (filesToUpload.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }
    
    const maxSize = 5 * 1024 * 1024 // 5MB per file
    const uploadedUrls: string[] = []
    
    for (const file of filesToUpload) {
      // Check file size
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} exceeds 5MB limit` },
          { status: 400 }
        )
      }
      
      // Create a unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const filename = `products/${timestamp}-${randomId}-${file.name}`
      
      // Convert File to Buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, filename)
      await uploadBytes(storageRef, buffer, {
        contentType: file.type
      })
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)
      uploadedUrls.push(downloadURL)
    }
    
    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      url: uploadedUrls[0], // For backward compatibility
      count: uploadedUrls.length
    })
  } catch (error: unknown) {
    console.error('Error uploading file:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
