import { supabase } from '@/lib/supabase'

function extensionFromMime(mime: string): string {
  if (mime === 'application/pdf') return 'pdf'
  if (mime === 'image/png') return 'png'
  return 'jpg'
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? extensionFromMime(file.type)
  const path = `${userId}/logo.${ext}`

  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadCompanyDocument(userId: string, file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from('company-docs').upload(path, file, {
    upsert: false,
    contentType: file.type,
  })
  if (error) throw error

  return path
}
