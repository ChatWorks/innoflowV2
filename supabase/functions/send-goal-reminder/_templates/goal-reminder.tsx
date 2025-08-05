import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface GoalReminderEmailProps {
  goalTitle: string;
  goalProgress: number;
  targetValue?: number;
  currentValue: number;
  deadline?: string;
  customMessage?: string;
  goalType: string;
  category: string;
  appUrl: string;
}

export const GoalReminderEmail = ({
  goalTitle,
  goalProgress,
  targetValue,
  currentValue,
  deadline,
  customMessage,
  goalType,
  category,
  appUrl,
}: GoalReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>🎯 Reminder voor je doel: {goalTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎯 Goal Reminder</Heading>
        
        <Text style={text}>
          Hallo! Dit is je reminder voor het volgende doel:
        </Text>

        <Section style={goalSection}>
          <Heading style={goalTitle}>{goalTitle}</Heading>
          <Text style={progressText}>
            Voortgang: <strong>{Math.round(goalProgress)}%</strong>
          </Text>
          
          {goalType !== 'boolean' && (
            <Text style={valueText}>
              Huidige waarde: <strong>{currentValue.toLocaleString()}</strong>
              {targetValue && <> van {targetValue.toLocaleString()}</>}
            </Text>
          )}

          {deadline && (
            <Text style={deadlineText}>
              ⏰ Deadline: <strong>{new Date(deadline).toLocaleDateString('nl-NL')}</strong>
            </Text>
          )}

          <Text style={categoryBadge}>
            Categorie: {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
        </Section>

        {customMessage && (
          <Section style={customSection}>
            <Text style={customText}>{customMessage}</Text>
          </Section>
        )}

        <Hr style={hr} />

        <Text style={text}>
          Klaar om vooruitgang te boeken? Klik op de knop hieronder om je doel bij te werken:
        </Text>

        <Link
          href={`${appUrl}/goals`}
          style={button}
        >
          Voortgang bijwerken
        </Link>

        <Text style={footerText}>
          Deze reminder is verstuurd vanuit Innoflow Goals. 
          Je kunt je notificatie instellingen aanpassen in je goal dashboard.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          <Link
            href={appUrl}
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            Innoflow
          </Link>
          {' '}| Bereik je doelen met focus en discipline
        </Text>
      </Container>
    </Body>
  </Html>
)

export default GoalReminderEmail

const main = {
  backgroundColor: '#f6f9fc',
  padding: '20px 0',
}

const container = {
  backgroundColor: '#ffffff',
  padding: '20px',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const h1 = {
  color: '#333',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
}

const goalSection = {
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
  border: '1px solid #e2e8f0',
}

const goalTitle = {
  color: '#1e293b',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 15px 0',
}

const progressText = {
  color: '#3b82f6',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '16px',
  margin: '8px 0',
}

const valueText = {
  color: '#64748b',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '14px',
  margin: '8px 0',
}

const deadlineText = {
  color: '#ef4444',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '14px',
  margin: '8px 0',
}

const categoryBadge = {
  color: '#6b7280',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '12px',
  backgroundColor: '#f3f4f6',
  padding: '4px 8px',
  borderRadius: '4px',
  display: 'inline-block',
  margin: '8px 0',
}

const customSection = {
  backgroundColor: '#fef3c7',
  padding: '15px',
  borderRadius: '8px',
  margin: '20px 0',
  border: '1px solid #fbbf24',
}

const customText = {
  color: '#92400e',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '14px',
  margin: '0',
  fontStyle: 'italic',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '20px 0',
}

const text = {
  color: '#333',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '14px',
  margin: '16px 0',
  lineHeight: '1.5',
}

const footerText = {
  color: '#6b7280',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '12px',
  margin: '16px 0',
  lineHeight: '1.5',
}

const footer = {
  color: '#898989',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  textAlign: 'center' as const,
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
}