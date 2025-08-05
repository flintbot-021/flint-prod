import type { Metadata } from 'next'
import { getPublishedCampaignWithSectionsByUserKey } from '@/lib/data-access/public-campaigns'

interface Props {
  params: Promise<{ userKey: string; slug: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: { params: Promise<{ userKey: string; slug: string }> }): Promise<Metadata> {
  const { userKey, slug } = await params

  // Default fallback metadata
  const defaultMetadata: Metadata = {
    title: "Interactive Tool | Flint",
    description: "Engage with this interactive tool to get personalized results and insights.",
    robots: "index, follow",
  }

  try {
    // Fetch the published campaign data
    const result = await getPublishedCampaignWithSectionsByUserKey(userKey, slug)

    if (!result.success || !result.data) {
      console.warn(`Failed to load campaign metadata for ${userKey}/${slug}:`, result.error)
      return defaultMetadata
    }

    const { campaign } = result.data

    // Extract SEO settings if available
    const seoSettings = campaign.settings?.seo || {}
    
    // Use custom SEO fields first, then fallback to campaign defaults
    const rawTitle = seoSettings.meta_title || campaign.name || "Interactive Tool"
    const rawDescription = seoSettings.meta_description || campaign.description || 
      "Complete this interactive tool to receive personalized insights and recommendations."

    // Create optimized title and description with proper truncation
    const title = rawTitle.length > 60 
      ? `${rawTitle.substring(0, 57)}...`
      : rawTitle

    const description = rawDescription.length > 160 
      ? `${rawDescription.substring(0, 157)}...`
      : rawDescription

    // Build metadata object
    const metadata: Metadata = {
      title,
      description,
      robots: "index, follow",
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      // Add structured data for better SEO
      other: {
        'tool-name': campaign.name || "Interactive Tool",
        'tool-type': 'interactive-tool',
      }
    }

    // Add custom OG image if specified
    if (seoSettings.og_image_url) {
      metadata.openGraph = {
        ...metadata.openGraph,
        images: [
          {
            url: seoSettings.og_image_url,
            width: 1200,
            height: 630,
            alt: title,
          }
        ]
      }
    }

    // Add canonical URL if specified
    if (seoSettings.canonical_url) {
      metadata.alternates = {
        canonical: seoSettings.canonical_url
      }
    }

    // Add keywords if specified
    if (seoSettings.keywords && seoSettings.keywords.length > 0) {
      metadata.keywords = seoSettings.keywords
    }

    return metadata
  } catch (error) {
    console.error(`Error generating metadata for ${userKey}/${slug}:`, error)
    return defaultMetadata
  }
}

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}