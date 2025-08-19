'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { Campaign } from '@/lib/types/database'

interface PrivacyNoticeModalProps {
  campaign: Campaign
  isOpen: boolean
  onClose: () => void
}

export function PrivacyNoticeModal({
  campaign,
  isOpen,
  onClose
}: PrivacyNoticeModalProps) {
  if (!isOpen) return null

  const privacySettings = campaign.settings?.privacy

  if (!privacySettings?.configured) {
    return null
  }

  const { organization_name, privacy_contact_email, organization_location, privacy_policy_url } = privacySettings

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Privacy Notice</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Privacy Notice Content */}
          <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
            <p className="text-gray-900 font-medium">
              We believe in being open about how your information is used. This privacy notice, required 
              under Article 13 of UK data protection law, tells you exactly what you need to know.
            </p>

            {/* Who's responsible */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Who's responsible</h3>
              <p>
                This tool is run by {organization_name}, {organization_location}. You can contact us at{' '}
                {privacy_policy_url ? (
                  <a 
                    href={privacy_policy_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {privacy_contact_email}
                  </a>
                ) : (
                  <a 
                    href={`mailto:${privacy_contact_email}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {privacy_contact_email}
                  </a>
                )}.
              </p>
            </div>

            {/* What we collect */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What we collect</h3>
              <p>
                As the data controller, we collect your answers in this tool and, if you choose to provide them 
                after your results have been generated, your contact details so we can show/send you your 
                results and any directly-relevant follow-up emails, related to the task you completed (these 
                are not marketing emails).
              </p>
            </div>

            {/* Why we use your data */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Why we use your data</h3>
              <ul className="space-y-1 ml-4">
                <li>- To generate your results and share them with you.</li>
                <li>- To keep the tool secure and running smoothly.</li>
                <li>- To send you marketing if you choose to opt in (you can change your mind anytime).</li>
              </ul>
            </div>

            {/* Who helps us */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Who helps us</h3>
              <p>
                Flint (trading name of Dyvr Limited) hosts and operates this tool as a data processor. Flint's AI 
                partners process your inputs to turn your answers into useful results.{' '}
                <a 
                  href="https://launch.useflint.app/privacy-cookie-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  See Flint's sub-processor list
                </a>.
              </p>
            </div>

            {/* Your rights */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Your rights</h3>
              <p>
                You have the right to ask us what personal data we hold about you, and to ask us to correct it 
                if it's wrong. You can also ask us to delete it, though we might need to keep it if we have a 
                good reason. You can ask us to limit what we do with your personal data, and you can object to 
                us using it. You also have the right to get a copy of your personal data in a format you can 
                use with another service.
              </p>
            </div>

            {/* How long we keep data */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How long we keep your data</h3>
              <p>
                We keep your data for as long as we need it to provide you with the service you've requested. 
                If you've given us your contact details, we'll keep them until you ask us to delete them or 
                until we no longer need them.
              </p>
            </div>

            {/* Complaints */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">If you're not happy</h3>
              <p>
                If you're not happy with how we've handled your personal data, you can complain to the 
                Information Commissioner's Office (ICO). You can find out more about your rights and how to 
                complain on the{' '}
                <a 
                  href="https://ico.org.uk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  ICO website
                </a>.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-6 mt-6 border-t">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
