import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Cloudinary credentials
const CLOUD_NAME = 'dgs5ffd18'
const API_KEY = '714587139116837'
const API_SECRET = 'pD2JjPrju1Bm81w8u298hPsbUeU'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'
    const dataUri = `data:${mimeType};base64,${base64}`

    let imageUrl: string | null = null

    // Upload to Cloudinary with signed upload
    try {
      const timestamp = Math.round(Date.now() / 1000)
      const folder = 'budget-bucket'
      
      // Create signature for signed upload
      const signatureString = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`
      const signature = crypto.createHash('sha1').update(signatureString).digest('hex')
      
      const cloudinaryForm = new FormData()
      cloudinaryForm.append('file', dataUri)
      cloudinaryForm.append('api_key', API_KEY)
      cloudinaryForm.append('timestamp', timestamp.toString())
      cloudinaryForm.append('signature', signature)
      cloudinaryForm.append('folder', folder)
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: cloudinaryForm
        }
      )
      
      const data = await response.json()
      
      if (data.secure_url) {
        console.log('Cloudinary upload success:', data.secure_url)
        imageUrl = data.secure_url
      } else {
        console.log('Cloudinary error:', JSON.stringify(data))
      }
    } catch (e) {
      console.log('Cloudinary failed:', e)
    }

    if (!imageUrl) {
      return NextResponse.json({ 
        error: 'Upload failed. Please try again.' 
      }, { status: 400 })
    }

    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
