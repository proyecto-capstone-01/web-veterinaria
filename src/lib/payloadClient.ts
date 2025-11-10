import {
    getSecret,
} from 'astro:env/server';

const CMS_API_URL = getSecret('CMS_API_URL') || 'http://localhost:3000';

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: any
  heroImage?: {
    id: string
    url: string
    alt?: string
  }
  meta?: {
    title?: string
    description?: string
    image?: {
      id: string
      url: string
    }
  }
  authors?: any[]
  categories?: any[]
  relatedPosts?: BlogPost[]
  publishedAt: string
  _status: 'published' | 'draft' | 'archived'
  createdAt: string
  updatedAt: string
}

export async function getBlogPosts(limit = 10, page = 1): Promise<{ posts: BlogPost[]; total: number }> {
  try {
    const response = await fetch(
      `${CMS_API_URL}/api/blog?where[_status][equals]=published&sort=-publishedAt&limit=${limit}&page=${page}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Error fetching posts: ${response.statusText}`)
    }

    const data = await response.json()
    return { posts: data.docs, total: data.totalDocs }
  } catch (error) {
    console.error('Error fetching posts:', error)
    return { posts: [], total: 0 }
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(
      `${CMS_API_URL}/api/blog?where[slug][equals]=${slug}&where[_status][equals]=published`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.docs[0] || null
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export async function getBlogPostsByCategory(categorySlug: string): Promise<BlogPost[]> {
  try {
    const response = await fetch(
      `${CMS_API_URL}/api/blog?where[_status][equals]=published&where[categories][slug][equals]=${categorySlug}&sort=-publishedAt`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.docs
  } catch (error) {
    console.error('Error fetching posts by category:', error)
    return []
  }
}

export function getImageUrl(imagePath: string): string {
  if (!imagePath) return ''
  if (imagePath.startsWith('http')) return imagePath
  return `${CMS_API_URL}${imagePath}`
}