'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PrimaryNavigation } from '@/components/primary-navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Palette, 
  Camera, 
  Upload, 
  Download, 
  Trash2, 
  Eye,
  Search,
  Grid,
  List,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getAssets, deleteAsset } from '@/lib/data-access/asset-library'
import { captureScreenshot } from '@/lib/utils/screenshot-capture'
import { uploadScreenshot, uploadAssetFile, generateAssetName } from '@/lib/utils/asset-storage'
import type { AssetLibraryItem } from '@/lib/types/asset-library'
import html2canvas from 'html2canvas'

const MOCKUP_TEMPLATES = [
  { id: 'phone-1', name: 'iPhone Mockup', icon: Smartphone },
  { id: 'desktop-1', name: 'MacBook Mockup', icon: Monitor },
  { id: 'tablet-1', name: 'iPad Mockup', icon: Tablet }
]

const BACKGROUND_OPTIONS = [
  { id: 'gradient-1', name: 'Purple Gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient-2', name: 'Blue Gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'gradient-3', name: 'Green Gradient', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'solid-white', name: 'White', value: '#ffffff' },
  { id: 'solid-black', name: 'Black', value: '#000000' },
  { id: 'solid-gray', name: 'Gray', value: '#f5f5f5' }
]

export default function AssetsPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  // State
  const [assets, setAssets] = useState<AssetLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedAsset, setSelectedAsset] = useState<AssetLibraryItem | null>(null)
  const [selectedMockup, setSelectedMockup] = useState('phone-1')
  const [selectedBackground, setSelectedBackground] = useState('gradient-1')
  
  // Screenshot capture state
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureDialogOpen, setCaptureDialogOpen] = useState(false)
  const [screenshotName, setScreenshotName] = useState('')
  const [screenshotDescription, setScreenshotDescription] = useState('')
  const [screenshotTags, setScreenshotTags] = useState('')
  
  // File upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadTags, setUploadTags] = useState('')

  // Check email domain access
  useEffect(() => {
    if (user && !user.email?.endsWith('@useflint.co')) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Load assets
  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const data = await getAssets({
        search: searchTerm || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined
      })
      setAssets(data)
    } catch (error) {
      console.error('Failed to load assets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter assets based on search and tags
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchTerm || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => asset.tags.includes(tag))
    
    return matchesSearch && matchesTags
  })

  // Get all unique tags
  const allTags = Array.from(new Set(assets.flatMap(asset => asset.tags)))

  // Handle screenshot capture
  const handleScreenshotCapture = async () => {
    try {
      setIsCapturing(true)
      
      // Capture the entire viewport
      const file = await captureScreenshot({
        filename: `${screenshotName || 'screenshot'}.png`,
        quality: 1,
        format: 'png'
      })

      // Upload to asset library
      const asset = await uploadScreenshot(file, {
        name: screenshotName || generateAssetName(undefined, 'screenshot'),
        description: screenshotDescription,
        tags: screenshotTags.split(',').map(tag => tag.trim()).filter(Boolean)
      })

      // Refresh assets list
      await loadAssets()
      
      // Reset form
      setScreenshotName('')
      setScreenshotDescription('')
      setScreenshotTags('')
      setCaptureDialogOpen(false)
      
      console.log('Screenshot captured and saved:', asset.id)
    } catch (error) {
      console.error('Screenshot capture failed:', error)
    } finally {
      setIsCapturing(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile) return

    try {
      const asset = await uploadAssetFile(uploadFile, {
        name: uploadName || uploadFile.name,
        description: uploadDescription,
        tags: uploadTags.split(',').map(tag => tag.trim()).filter(Boolean),
        source_type: 'upload'
      })

      // Refresh assets list
      await loadAssets()
      
      // Reset form
      setUploadFile(null)
      setUploadName('')
      setUploadDescription('')
      setUploadTags('')
      setUploadDialogOpen(false)
      
      console.log('File uploaded:', asset.id)
    } catch (error) {
      console.error('File upload failed:', error)
    }
  }

  // Handle asset deletion
  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      await deleteAsset(assetId)
      await loadAssets()
    } catch (error) {
      console.error('Failed to delete asset:', error)
    }
  }

  // Generate mockup with selected asset
  const generateMockup = async () => {
    if (!selectedAsset) return

    try {
      console.log('🎨 Starting mockup generation...')
      
      // Create a temporary mockup preview element (matching preview aspect ratio)
      const mockupElement = document.createElement('div')
      mockupElement.style.width = '800px'
      mockupElement.style.height = '600px'
      mockupElement.style.position = 'fixed'
      mockupElement.style.top = '-10000px'
      mockupElement.style.left = '-10000px'
      mockupElement.style.background = BACKGROUND_OPTIONS.find(bg => bg.id === selectedBackground)?.value || BACKGROUND_OPTIONS[0].value
      mockupElement.style.display = 'flex'
      mockupElement.style.alignItems = 'center'
      mockupElement.style.justifyContent = 'center'
      mockupElement.style.padding = '40px'
      mockupElement.style.fontFamily = 'Arial, sans-serif'
      mockupElement.style.borderRadius = '8px'

      // Create device mockup with proper styling
      let deviceContainer: HTMLElement
      let screenContainer: HTMLElement

      if (selectedMockup === 'phone-1') {
        deviceContainer = document.createElement('div')
        deviceContainer.style.position = 'relative'
        deviceContainer.style.boxShadow = '0 25px 50px rgba(0,0,0,0.3)'
        deviceContainer.style.width = '120px'
        deviceContainer.style.height = '240px'
        
        // Phone Frame
        const phoneFrame = document.createElement('div')
        phoneFrame.style.width = '100%'
        phoneFrame.style.height = '100%'
        phoneFrame.style.backgroundColor = '#000'
        phoneFrame.style.borderRadius = '20px'
        phoneFrame.style.padding = '8px'
        deviceContainer.appendChild(phoneFrame)
        
        // Add notch
        const notch = document.createElement('div')
        notch.style.position = 'absolute'
        notch.style.top = '0'
        notch.style.left = '50%'
        notch.style.transform = 'translateX(-50%)'
        notch.style.width = '64px'
        notch.style.height = '12px'
        notch.style.backgroundColor = '#000'
        notch.style.borderRadius = '0 0 8px 8px'
        notch.style.zIndex = '10'
        phoneFrame.appendChild(notch)
        
        // Create screen container for phone
        screenContainer = document.createElement('div')
        screenContainer.style.width = '100%'
        screenContainer.style.height = '100%'
        screenContainer.style.backgroundColor = '#fff'
        screenContainer.style.borderRadius = '16px'
        screenContainer.style.overflow = 'hidden'
        screenContainer.style.position = 'relative'
        phoneFrame.appendChild(screenContainer)
        
      } else if (selectedMockup === 'desktop-1') {
        deviceContainer = document.createElement('div')
        deviceContainer.style.position = 'relative'
        deviceContainer.style.boxShadow = '0 25px 50px rgba(0,0,0,0.3)'
        deviceContainer.style.width = '200px'
        deviceContainer.style.height = '140px'
        
        // Create laptop screen
        const screen = document.createElement('div')
        screen.style.width = '100%'
        screen.style.height = '85%'
        screen.style.backgroundColor = '#000'
        screen.style.borderRadius = '8px 8px 0 0'
        screen.style.padding = '4px'
        deviceContainer.appendChild(screen)
        
        // Create laptop base
        const base = document.createElement('div')
        base.style.width = '100%'
        base.style.height = '15%'
        base.style.backgroundColor = '#c0c0c0'
        base.style.borderRadius = '0 0 8px 8px'
        deviceContainer.appendChild(base)
        
        // Create screen container for desktop
        screenContainer = document.createElement('div')
        screenContainer.style.width = '100%'
        screenContainer.style.height = '100%'
        screenContainer.style.backgroundColor = '#fff'
        screenContainer.style.borderRadius = '4px'
        screenContainer.style.overflow = 'hidden'
        screenContainer.style.position = 'relative'
        screen.appendChild(screenContainer)
        
      } else if (selectedMockup === 'tablet-1') {
        deviceContainer = document.createElement('div')
        deviceContainer.style.position = 'relative'
        deviceContainer.style.boxShadow = '0 25px 50px rgba(0,0,0,0.3)'
        deviceContainer.style.width = '140px'
        deviceContainer.style.height = '180px'
        
        // Tablet Frame
        const tabletFrame = document.createElement('div')
        tabletFrame.style.width = '100%'
        tabletFrame.style.height = '100%'
        tabletFrame.style.backgroundColor = '#000'
        tabletFrame.style.borderRadius = '16px'
        tabletFrame.style.padding = '8px'
        deviceContainer.appendChild(tabletFrame)
        
        // Create screen container for tablet
        screenContainer = document.createElement('div')
        screenContainer.style.width = '100%'
        screenContainer.style.height = '100%'
        screenContainer.style.backgroundColor = '#fff'
        screenContainer.style.borderRadius = '12px'
        screenContainer.style.overflow = 'hidden'
        screenContainer.style.position = 'relative'
        tabletFrame.appendChild(screenContainer)
        
      } else {
        // Fallback
        deviceContainer = document.createElement('div')
        screenContainer = document.createElement('div')
      }

      // Add asset image to screen container
      const assetImage = document.createElement('img')
      assetImage.src = selectedAsset.public_url
      assetImage.style.width = '100%'
      assetImage.style.height = '100%'
      assetImage.style.objectFit = 'contain'
      assetImage.style.display = 'block'
      
      // Set crossOrigin to handle CORS
      assetImage.crossOrigin = 'anonymous'

      screenContainer.appendChild(assetImage)
      
      mockupElement.appendChild(deviceContainer)
      document.body.appendChild(mockupElement)

      console.log('📷 Waiting for image to load...')
      
      // Wait for image to load with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('⚠️ Image load timeout, proceeding anyway...')
          resolve(null)
        }, 5000)
        
        assetImage.onload = () => {
          clearTimeout(timeout)
          console.log('✅ Image loaded successfully')
          resolve(null)
        }
        
        assetImage.onerror = (error) => {
          clearTimeout(timeout)
          console.log('⚠️ Image load error, proceeding anyway...', error)
          resolve(null)
        }
        
        // If image is already loaded (cached)
        if (assetImage.complete) {
          clearTimeout(timeout)
          console.log('✅ Image already loaded (cached)')
          resolve(null)
        }
      })

      // Small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('🖼️ Capturing mockup with html2canvas...')
      
      // Capture the mockup (matching preview dimensions)
      const canvas = await html2canvas(mockupElement, {
        width: 800,
        height: 600,
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false
      })

      console.log('✅ Canvas captured successfully')

      // Clean up
      document.body.removeChild(mockupElement)

      // Download the result
      console.log('💾 Initiating download...')
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${selectedAsset.name.replace(/[^a-zA-Z0-9]/g, '_')}-${selectedMockup}-mockup.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          console.log('✅ Download initiated successfully')
        } else {
          console.error('❌ Failed to create blob from canvas')
        }
      }, 'image/png', 1.0)

    } catch (error) {
      console.error('❌ Failed to generate mockup:', error)
      alert('Failed to generate mockup. Please try again.')
    }
  }

  if (!user?.email?.endsWith('@useflint.co')) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <PrimaryNavigation currentPage="assets" />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Palette className="h-8 w-8 text-orange-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Asset Library</h1>
                  <p className="text-gray-600">Manage your marketing assets and create beautiful mockups</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Screenshot Capture Dialog */}
                <Dialog open={captureDialogOpen} onOpenChange={setCaptureDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Camera className="h-4 w-4 mr-2" />
                      Take Screenshot
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Capture Screenshot</DialogTitle>
                      <DialogDescription>
                        Take a screenshot of the current page and add it to your asset library.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="screenshot-name">Name</Label>
                        <Input
                          id="screenshot-name"
                          value={screenshotName}
                          onChange={(e) => setScreenshotName(e.target.value)}
                          placeholder="Enter asset name..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="screenshot-description">Description</Label>
                        <Textarea
                          id="screenshot-description"
                          value={screenshotDescription}
                          onChange={(e) => setScreenshotDescription(e.target.value)}
                          placeholder="Enter description..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="screenshot-tags">Tags (comma-separated)</Label>
                        <Input
                          id="screenshot-tags"
                          value={screenshotTags}
                          onChange={(e) => setScreenshotTags(e.target.value)}
                          placeholder="screenshot, campaign, mobile..."
                        />
                      </div>
                      <Button 
                        onClick={handleScreenshotCapture} 
                        disabled={isCapturing}
                        className="w-full"
                      >
                        {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* File Upload Dialog */}
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Asset</DialogTitle>
                      <DialogDescription>
                        Upload an image file to your asset library.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="upload-file">File</Label>
                        <Input
                          id="upload-file"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="upload-name">Name</Label>
                        <Input
                          id="upload-name"
                          value={uploadName}
                          onChange={(e) => setUploadName(e.target.value)}
                          placeholder="Enter asset name..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="upload-description">Description</Label>
                        <Textarea
                          id="upload-description"
                          value={uploadDescription}
                          onChange={(e) => setUploadDescription(e.target.value)}
                          placeholder="Enter description..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="upload-tags">Tags (comma-separated)</Label>
                        <Input
                          id="upload-tags"
                          value={uploadTags}
                          onChange={(e) => setUploadTags(e.target.value)}
                          placeholder="design, mockup, hero..."
                        />
                      </div>
                      <Button 
                        onClick={handleFileUpload} 
                        disabled={!uploadFile}
                        className="w-full"
                      >
                        Upload Asset
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm text-gray-600">Filter by tags:</span>
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag))
                      } else {
                        setSelectedTags([...selectedTags, tag])
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTags([])}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assets Library */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Assets ({filteredAssets.length})</CardTitle>
                  <CardDescription>
                    Screenshots and uploaded images for creating mockups
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading assets...</p>
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="text-center py-8">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No assets found</p>
                      <p className="text-sm text-gray-500">
                        {searchTerm || selectedTags.length > 0 
                          ? 'Try adjusting your search or filters'
                          : 'Take a screenshot or upload an image to get started'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-4' : 'space-y-4'}>
                      {filteredAssets.map(asset => (
                        <div
                          key={asset.id}
                          className={`group cursor-pointer border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                            selectedAsset?.id === asset.id ? 'ring-2 ring-orange-500' : ''
                          } ${viewMode === 'list' ? 'flex items-center p-4' : ''}`}
                          onClick={() => setSelectedAsset(asset)}
                        >
                          <div className={viewMode === 'list' ? 'w-16 h-16 flex-shrink-0 mr-4' : 'aspect-square'}>
                            <img
                              src={asset.public_url}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className={viewMode === 'list' ? 'flex-1' : 'p-3'}>
                            <h3 className="font-medium text-sm truncate">{asset.name}</h3>
                            {asset.description && (
                              <p className="text-xs text-gray-600 truncate mt-1">{asset.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex flex-wrap gap-1">
                                {asset.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {asset.tags.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{asset.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteAsset(asset.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Mockup Generator */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Mockup Generator</CardTitle>
                  <CardDescription>
                    Create beautiful mockups with your selected asset
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedAsset ? (
                    <>
                      {/* Selected Asset Preview */}
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={selectedAsset.public_url}
                            alt={selectedAsset.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{selectedAsset.name}</h4>
                            <p className="text-xs text-gray-600">
                              {selectedAsset.width && selectedAsset.height 
                                ? `${selectedAsset.width} × ${selectedAsset.height}px`
                                : 'Image asset'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mockup Template Selection */}
                      <div>
                        <Label>Device Template</Label>
                        <Select value={selectedMockup} onValueChange={setSelectedMockup}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MOCKUP_TEMPLATES.map(template => {
                              const Icon = template.icon
                              return (
                                <SelectItem key={template.id} value={template.id}>
                                  <div className="flex items-center space-x-2">
                                    <Icon className="h-4 w-4" />
                                    <span>{template.name}</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Background Selection */}
                      <div>
                        <Label>Background</Label>
                        <Select value={selectedBackground} onValueChange={setSelectedBackground}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BACKGROUND_OPTIONS.map(bg => (
                              <SelectItem key={bg.id} value={bg.id}>
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-4 h-4 rounded border"
                                    style={{ background: bg.value }}
                                  />
                                  <span>{bg.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Mockup Preview */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <Label className="text-sm font-medium mb-2 block">Preview</Label>
                        <div 
                          className="w-full aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center"
                          style={{ 
                            background: BACKGROUND_OPTIONS.find(bg => bg.id === selectedBackground)?.value || BACKGROUND_OPTIONS[0].value 
                          }}
                        >
                          {/* Device Mockup Preview */}
                          {selectedMockup === 'phone-1' && (
                            <div className="relative" style={{ width: '120px', height: '240px' }}>
                              {/* Phone Frame */}
                              <div className="w-full h-full bg-black rounded-[20px] p-2 shadow-lg">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-3 bg-black rounded-b-lg z-10"></div>
                                {/* Screen */}
                                <div className="w-full h-full bg-white rounded-[16px] overflow-hidden">
                                  <img
                                    src={selectedAsset.public_url}
                                    alt={selectedAsset.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {selectedMockup === 'desktop-1' && (
                            <div className="relative" style={{ width: '200px', height: '140px' }}>
                              {/* Laptop Frame */}
                              <div className="w-full h-full">
                                {/* Screen */}
                                <div className="w-full h-[85%] bg-black rounded-t-lg p-1 shadow-lg">
                                  <div className="w-full h-full bg-white rounded-t-md overflow-hidden">
                                    <img
                                      src={selectedAsset.public_url}
                                      alt={selectedAsset.name}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                </div>
                                {/* Base */}
                                <div className="w-full h-[15%] bg-gray-300 rounded-b-lg"></div>
                              </div>
                            </div>
                          )}
                          
                          {selectedMockup === 'tablet-1' && (
                            <div className="relative" style={{ width: '140px', height: '180px' }}>
                              {/* Tablet Frame */}
                              <div className="w-full h-full bg-black rounded-[16px] p-2 shadow-lg">
                                {/* Screen */}
                                <div className="w-full h-full bg-white rounded-[12px] overflow-hidden">
                                  <img
                                    src={selectedAsset.public_url}
                                    alt={selectedAsset.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Generate Button */}
                      <Button onClick={generateMockup} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Generate & Download Mockup
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Select an asset to create a mockup</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
