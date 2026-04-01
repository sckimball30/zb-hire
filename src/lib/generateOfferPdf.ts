import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'

export interface OfferPdfData {
  candidateFirstName: string
  candidateLastName: string
  jobTitle: string
  employmentType: 'FULL_TIME' | 'PART_TIME' | null
  salary: number | null
  salaryType: 'ANNUAL' | 'HOURLY'
  currency: string
  bonus: string | null
  startDate: Date | null
  notes: string | null
  signatureName: string
  signedAt: Date
  department: string | null
  location: string | null
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.5,
    paddingTop: 50,
    paddingBottom: 50,
    paddingLeft: 50,
    paddingRight: 50,
    color: '#222222',
  },
  header: {
    backgroundColor: '#111111',
    paddingVertical: 24,
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  headerLeft: {},
  headerCompany: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#4AFFD2',
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerOfferLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerDate: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 4,
  },
  greeting: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  candidateName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: '#111111',
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#374151',
    marginBottom: 20,
  },
  detailsBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  detailValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#111111',
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#374151',
    marginBottom: 8,
  },
  sectionBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
  },
  sectionText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 1.6,
  },
  bonusBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
  },
  bonusText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 1.6,
  },
  closingText: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#374151',
    marginBottom: 20,
  },
  sincerely: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  sincerelyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#111111',
    marginBottom: 24,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 20,
  },
  signatureBlock: {
    marginTop: 4,
  },
  signatureLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },
  signatureName: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 18,
    color: '#111111',
    marginBottom: 8,
  },
  signatureDate: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 8,
  },
  esignNote: {
    fontSize: 9,
    color: '#9CA3AF',
    fontFamily: 'Helvetica-Oblique',
  },
})

function formatSalary(salary: number, salaryType: string, currency: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(salary)
  return salaryType === 'HOURLY' ? `${formatted}/hr` : `${formatted}/yr`
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function OfferPdfDocument({ data }: { data: OfferPdfData }) {
  const today = formatDate(new Date())

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'LETTER', style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          { style: styles.headerLeft },
          React.createElement(Text, { style: styles.headerCompany }, 'ZB Designs / Wigglitz'),
          React.createElement(Text, { style: styles.headerSubtitle }, 'Offer Letter')
        ),
        React.createElement(
          View,
          { style: styles.headerRight },
          React.createElement(Text, { style: styles.headerOfferLabel }, 'Offer Letter'),
          React.createElement(Text, { style: styles.headerDate }, today)
        )
      ),

      // Greeting
      React.createElement(Text, { style: styles.greeting }, 'Dear'),
      React.createElement(
        Text,
        { style: styles.candidateName },
        `${data.candidateFirstName} ${data.candidateLastName},`
      ),

      // Opening paragraph
      React.createElement(
        Text,
        { style: styles.bodyText },
        `We are pleased to offer you the position of ${data.jobTitle} at ZB Designs. After careful consideration, we believe your skills and experience make you an excellent fit for our team, and we look forward to welcoming you aboard.`
      ),

      // Offer Details Box
      React.createElement(
        View,
        { style: styles.detailsBox },
        React.createElement(Text, { style: styles.detailsTitle }, 'Offer Details'),
        React.createElement(
          View,
          { style: styles.detailsGrid },

          // Position
          React.createElement(
            View,
            { style: styles.detailItem },
            React.createElement(Text, { style: styles.detailLabel }, 'Position'),
            React.createElement(Text, { style: styles.detailValue }, data.jobTitle)
          ),

          // Employment Type
          ...(data.employmentType
            ? [
                React.createElement(
                  View,
                  { style: styles.detailItem, key: 'emptype' },
                  React.createElement(Text, { style: styles.detailLabel }, 'Employment Type'),
                  React.createElement(
                    Text,
                    { style: styles.detailValue },
                    data.employmentType === 'FULL_TIME' ? 'Full-time' : 'Part-time'
                  )
                ),
              ]
            : []),

          // Compensation
          ...(data.salary
            ? [
                React.createElement(
                  View,
                  { style: styles.detailItem, key: 'salary' },
                  React.createElement(Text, { style: styles.detailLabel }, 'Compensation'),
                  React.createElement(
                    Text,
                    { style: styles.detailValue },
                    formatSalary(data.salary, data.salaryType, data.currency)
                  )
                ),
              ]
            : []),

          // Start Date
          ...(data.startDate
            ? [
                React.createElement(
                  View,
                  { style: styles.detailItem, key: 'startdate' },
                  React.createElement(Text, { style: styles.detailLabel }, 'Start Date'),
                  React.createElement(
                    Text,
                    { style: styles.detailValue },
                    formatDate(data.startDate)
                  )
                ),
              ]
            : []),

          // Department
          ...(data.department
            ? [
                React.createElement(
                  View,
                  { style: styles.detailItem, key: 'dept' },
                  React.createElement(Text, { style: styles.detailLabel }, 'Department'),
                  React.createElement(Text, { style: styles.detailValue }, data.department)
                ),
              ]
            : []),

          // Location
          ...(data.location
            ? [
                React.createElement(
                  View,
                  { style: styles.detailItem, key: 'loc' },
                  React.createElement(Text, { style: styles.detailLabel }, 'Location'),
                  React.createElement(Text, { style: styles.detailValue }, data.location)
                ),
              ]
            : [])
        )
      ),

      // Bonus Structure (optional)
      ...(data.bonus
        ? [
            React.createElement(Text, { style: styles.sectionTitle, key: 'bonustitle' }, 'Bonus Structure'),
            React.createElement(
              View,
              { style: styles.bonusBox, key: 'bonusbox' },
              React.createElement(Text, { style: styles.bonusText }, data.bonus)
            ),
          ]
        : []),

      // Additional Terms (optional)
      ...(data.notes
        ? [
            React.createElement(Text, { style: styles.sectionTitle, key: 'notestitle' }, 'Additional Terms'),
            React.createElement(
              View,
              { style: styles.sectionBox, key: 'notesbox' },
              React.createElement(Text, { style: styles.sectionText }, data.notes)
            ),
          ]
        : []),

      // Closing paragraph
      React.createElement(
        Text,
        { style: styles.closingText },
        'Please review these terms carefully. If you have any questions or would like to discuss any aspect of this offer, feel free to reach out to us directly. We are excited about the possibility of you joining our team and hope you will accept.'
      ),

      // Sincerely
      React.createElement(Text, { style: styles.sincerely }, 'Sincerely,'),
      React.createElement(Text, { style: styles.sincerelyName }, 'The ZB Designs Team'),

      // Divider
      React.createElement(View, { style: styles.divider }),

      // Signature block
      React.createElement(
        View,
        { style: styles.signatureBlock },
        React.createElement(Text, { style: styles.signatureLabel }, 'Electronically accepted by:'),
        React.createElement(Text, { style: styles.signatureName }, data.signatureName),
        React.createElement(
          Text,
          { style: styles.signatureDate },
          `Date signed: ${formatDate(data.signedAt)}`
        ),
        React.createElement(
          Text,
          { style: styles.esignNote },
          'By typing their name above, the candidate has agreed to these terms under the ESIGN Act.'
        )
      )
    )
  )
}

export async function generateOfferPdf(data: OfferPdfData): Promise<Buffer> {
  const doc = React.createElement(OfferPdfDocument, { data })
  const pdfBuffer = await pdf(doc).toBuffer()
  return Buffer.from(pdfBuffer)
}
