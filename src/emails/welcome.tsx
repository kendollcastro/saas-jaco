import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  tenantName: string;
  dashboardUrl: string;
}

export default function WelcomeEmail({
  name = "Usuario",
  tenantName = "Tu Negocio",
  dashboardUrl = "https://olasaas.com/dashboard",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bienvenido a Ola Saas — {tenantName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bienvenido a Ola Saas</Heading>
          <Text style={text}>Hola {name},</Text>
          <Text style={text}>
            Tu cuenta para <strong>{tenantName}</strong> ha sido creada
            exitosamente. Ya podés empezar a gestionar tu negocio turístico
            desde un solo lugar.
          </Text>
          <Section style={section}>
            <Button style={button} href={dashboardUrl}>
              Ir al Dashboard
            </Button>
          </Section>
          <Text style={text}>
            Si el botón no funciona, copiá este enlace en tu navegador:
          </Text>
          <Link style={link} href={dashboardUrl}>
            {dashboardUrl}
          </Link>
          <Hr style={hr} />
          <Text style={footer}>
            Ola Saas — Hecho en Costa Rica 🇨🇷
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f6f9",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 24px",
  maxWidth: "480px",
};

const h1 = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "800",
  lineHeight: "1.3",
  margin: "0 0 20px",
};

const text = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const section = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button = {
  backgroundColor: "#1e40af",
  borderRadius: "11px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "700",
  padding: "13px 32px",
  textDecoration: "none",
  display: "inline-block",
};

const link = {
  color: "#1e40af",
  fontSize: "13px",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "28px 0 16px",
};

const footer = {
  color: "#94a3b8",
  fontSize: "12px",
};
