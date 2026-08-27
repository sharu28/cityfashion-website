import Script from "next/script";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  if (!measurementId) {
    return null;
  }

  const serializedMeasurementId = JSON.stringify(measurementId);

  return (
    <>
      <script
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            var consentChoice = null;
            try {
              consentChoice = window.localStorage.getItem('cityfashion_cookie_consent');
            } catch (error) {}
            var consentGranted = consentChoice === 'accepted';
            gtag('consent', 'default', {
              ad_storage: consentGranted ? 'granted' : 'denied',
              analytics_storage: consentGranted ? 'granted' : 'denied',
              ad_user_data: consentGranted ? 'granted' : 'denied',
              ad_personalization: consentGranted ? 'granted' : 'denied',
              wait_for_update: 500
            });
            gtag('set', 'ads_data_redaction', true);
            gtag('set', 'url_passthrough', true);
            gtag('js', new Date());
            gtag('config', ${serializedMeasurementId});
          `,
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
    </>
  );
}
