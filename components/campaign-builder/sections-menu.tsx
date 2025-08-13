'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SectionTypeCard } from './section-type-card'
import { 
  SECTION_TYPES, 
  SECTION_CATEGORIES, 
  getSectionTypesByCategory,
  SectionType 
} from '@/lib/types/campaign-builder'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface SectionsMenuProps {
  className?: string
  onSectionAdd?: (sectionType: SectionType) => void
}

export function SectionsMenu({ className, onSectionAdd }: SectionsMenuProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['input', 'output']) // Start with input & output expanded to promote Advanced Output
  )

  // Check if user has access to advanced features
  const hasAdvancedAccess = user?.email?.endsWith('@useflint.co') || false

  // Filter sections based on search term and access control
  const filteredSections = SECTION_TYPES.filter(section => {
    // Filter out advanced output for unauthorized users
    if (section.id === 'output-advanced' && !hasAdvancedAccess) {
      return false
    }
    
    // Apply search filter
    return section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           section.description.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const getSectionCount = (categoryId: string) => {
    const categorySections = getSectionTypesByCategory(categoryId as SectionType['category'])
    
    // Apply access control filter
    const accessFilteredSections = categorySections.filter(section => {
      // Filter out advanced output for unauthorized users
      if (section.id === 'output-advanced' && !hasAdvancedAccess) {
        return false
      }
      return true
    })
    
    if (searchTerm) {
      return accessFilteredSections.filter(section =>
        section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.description.toLowerCase().includes(searchTerm.toLowerCase())
      ).length
    }
    return accessFilteredSections.length
  }

  const getCategorySections = (categoryId: string) => {
    const categorySections = getSectionTypesByCategory(categoryId as SectionType['category'])
    
    // Apply access control filter
    const accessFilteredSections = categorySections.filter(section => {
      // Filter out advanced output for unauthorized users
      if (section.id === 'output-advanced' && !hasAdvancedAccess) {
        return false
      }
      return true
    })
    
    if (searchTerm) {
      return accessFilteredSections.filter(section =>
        section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return accessFilteredSections
  }

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3">
          Section Components
        </h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {searchTerm && (
          <div className="mt-2 text-sm text-muted-foreground">
            {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {searchTerm ? (
          /* Search Results */
          <div className="p-4 space-y-3">
            {filteredSections.length > 0 ? (
              filteredSections.map((sectionType) => (
                <SectionTypeCard
                  key={sectionType.id}
                  sectionType={sectionType}
                  onAdd={onSectionAdd}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No sections found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            )}
          </div>
        ) : (
          /* Categorized Sections */
          <div className="divide-y divide-gray-200">
            {SECTION_CATEGORIES.map((category) => {
              const sectionCount = getSectionCount(category.id)
              const isExpanded = expandedCategories.has(category.id)
              const CategoryIcon = Icons[category.icon as keyof typeof Icons] as React.ComponentType<{
                className?: string
              }>

              if (sectionCount === 0) return null

              return (
                <div key={category.id}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          {CategoryIcon && (
                            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium text-foreground">
                          {category.name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {sectionCount}
                      </Badge>
                    </div>
                  </button>

                  {/* Category Sections */}
                  {isExpanded && (
                    <div className="px-4 pt-3 pb-4 space-y-3">
                      {getCategorySections(category.id).map((sectionType) => (
                        <SectionTypeCard
                          key={sectionType.id}
                          sectionType={sectionType}
                          onAdd={onSectionAdd}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>


    </div>
  )
} 