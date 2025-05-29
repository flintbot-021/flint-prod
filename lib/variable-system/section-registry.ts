/**
 * Section Registry Implementation
 * 
 * Registry for managing section types and their configurations.
 * Enables dynamic registration and retrieval of section components.
 */

import {
  SectionRegistry,
  SectionTypeDefinition,
  SectionConfig,
  BaseSectionSettings,
  Section,
  VariableValidationResult
} from '../types/variable-system'

/**
 * Section registry implementation with in-memory storage
 */
export class SectionRegistryImpl implements SectionRegistry {
  private sectionTypes = new Map<string, SectionTypeDefinition>()
  private sectionConfigs = new Map<string, SectionConfig<any>>()

  /**
   * Register a section type
   */
  register<T extends BaseSectionSettings>(config: SectionConfig<T>): void {
    const typeId = config.type.id

    // Validate configuration
    this.validateConfig(config)

    // Check for conflicts
    if (this.sectionTypes.has(typeId)) {
      console.warn(`Section type '${typeId}' is already registered. Overwriting...`)
    }

    // Store configuration
    this.sectionTypes.set(typeId, config.type)
    this.sectionConfigs.set(typeId, config)

    console.log(`Section type registered: ${typeId} (${config.type.name})`)
  }

  /**
   * Unregister a section type
   */
  unregister(typeId: string): void {
    if (!this.sectionTypes.has(typeId)) {
      throw new Error(`Section type '${typeId}' is not registered`)
    }

    this.sectionTypes.delete(typeId)
    this.sectionConfigs.delete(typeId)

    console.log(`Section type unregistered: ${typeId}`)
  }

  /**
   * Get section type definition
   */
  getType(typeId: string): SectionTypeDefinition | undefined {
    return this.sectionTypes.get(typeId)
  }

  /**
   * Get all section types
   */
  getTypes(): SectionTypeDefinition[] {
    return Array.from(this.sectionTypes.values())
  }

  /**
   * Get section types by category
   */
  getTypesByCategory(category: SectionTypeDefinition['category']): SectionTypeDefinition[] {
    return Array.from(this.sectionTypes.values()).filter(
      type => type.category === category
    )
  }

  /**
   * Get section configuration
   */
  getConfig<T extends BaseSectionSettings>(typeId: string): SectionConfig<T> | undefined {
    return this.sectionConfigs.get(typeId) as SectionConfig<T> | undefined
  }

  /**
   * Check if section type is registered
   */
  hasType(typeId: string): boolean {
    return this.sectionTypes.has(typeId)
  }

  /**
   * Create section instance
   */
  createSection<T extends BaseSectionSettings>(
    typeId: string, 
    settings: Partial<T>
  ): Section<T> | undefined {
    const sectionType = this.sectionTypes.get(typeId)
    const config = this.sectionConfigs.get(typeId)

    if (!sectionType || !config) {
      console.error(`Section type '${typeId}' is not registered`)
      return undefined
    }

    // Merge with default settings
    const fullSettings = {
      type: typeId,
      ...sectionType.defaultSettings,
      ...settings
    } as T

    // Initialize settings if initializer provided
    const finalSettings = config.initializer 
      ? config.initializer(fullSettings)
      : fullSettings

    // Create section instance
    const section: Section<T> = {
      id: this.generateSectionId(),
      type: typeId,
      settings: finalSettings,
      order: 0,
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      getVariableProducers: () => {
        // This will be implemented when we add variable system integration
        return []
      },

      getVariableConsumers: () => {
        // This will be implemented when we add variable system integration
        return []
      },

      validate: (): VariableValidationResult => {
        if (config.validator) {
          return config.validator(finalSettings)
        }
        return { isValid: true, errors: [], warnings: [] }
      }
    }

    return section
  }

  // Private helper methods

  private validateConfig<T extends BaseSectionSettings>(config: SectionConfig<T>): void {
    // Validate type definition
    this.validateTypeDefinition(config.type)

    // Validate component
    if (!config.component) {
      throw new Error(`Section type '${config.type.id}' must have a component`)
    }

    // Validate version
    if (!config.type.version || !this.isValidVersion(config.type.version)) {
      throw new Error(`Section type '${config.type.id}' must have a valid version`)
    }
  }

  private validateTypeDefinition(type: SectionTypeDefinition): void {
    if (!type.id) {
      throw new Error('Section type ID is required')
    }
    if (!type.name) {
      throw new Error('Section type name is required')
    }
    if (!type.description) {
      throw new Error('Section type description is required')
    }
    if (!type.icon) {
      throw new Error('Section type icon is required')
    }
    if (!['input', 'content', 'logic', 'output'].includes(type.category)) {
      throw new Error(`Invalid section category: ${type.category}`)
    }
    if (!type.color) {
      throw new Error('Section type color is required')
    }
  }

  private isValidVersion(version: string): boolean {
    // Simple semantic version validation
    const semverRegex = /^\d+\.\d+\.\d+$/
    return semverRegex.test(version)
  }

  private generateSectionId(): string {
    return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Singleton instance of the section registry
 */
export const sectionRegistry = new SectionRegistryImpl() 