import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';

export default Alchemy.Stack(
  'Zone',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
    secrets: Alchemy.Secrets.DotEnv(),
  },
  Effect.gen(function* () {
    const env = yield* Config.all({
      zoneDomain: Config.String('ZONE_DOMAIN'),
      email: Config.all({
        abuse: Config.String('EMAIL_ABUSE'),
        security: Config.String('EMAIL_SECURITY'),
        postmaster: Config.String('EMAIL_POSTMASTER'),
        hostmaster: Config.String('EMAIL_HOSTMASTER'),
        webmaster: Config.String('EMAIL_WEBMASTER'),
        dmarcReports: Config.String('EMAIL_DMARC_REPORTS'),
        tlsReports: Config.String('EMAIL_TLS_REPORTS'),
        forwardDestination: Config.String('EMAIL_FORWARD_DESTINATION'),
      }),
    });

    yield* Effect.gen(function* () {
      yield* Cloudflare.Registrar.Domain('Registration', {
        domainName: env.zoneDomain,
        autoRenew: true, // Registration renewed by Cloudflare before it expires.
        locked: true, // Transfers to another registrar refused by Cloudflare.
        privacy: true, // Registrant details redacted by Cloudflare.
      });

      const zone = yield* Cloudflare.Zone.Zone('Zone', {
        name: env.zoneDomain,
        paused: false, // Requests proxied by Cloudflare.
      });

      yield* Cloudflare.DNS.ZoneDnsSettings('DnsSettings', {
        zoneId: zone.zoneId,
        zoneMode: 'standard', // Records answered and proxied by Cloudflare.
        flattenAllCnames: false, // CNAME records served as declared, as RFC 1034 defines.
        nsTtl: 86400, // NS records cached by resolvers for a day.
      });

      yield* Cloudflare.DNS.Dnssec('Dnssec', {
        zoneId: zone.zoneId,
        status: 'active', // Zone signed by Cloudflare, as RFC 4033 defines.
        dnssecMultiSigner: false, // Zone signed by Cloudflare alone.
      });

      yield* Cloudflare.Email.Routing('EmailRouting', {
        zone: zone.zoneId,
        enabled: true, // Mail received for the zone by Cloudflare.
      });

      yield* Cloudflare.Email.Rule('Abuse', {
        zone: zone.zoneId,
        enabled: true, // Mailbox kept, as RFC 2142 defines.
        matchers: [{ type: 'literal', field: 'to', value: env.email.abuse }],
        actions: [{ type: 'forward', value: [env.email.forwardDestination] }],
      });

      yield* Cloudflare.Email.Rule('Security', {
        zone: zone.zoneId,
        enabled: true, // Mailbox kept, as RFC 2142 defines.
        matchers: [{ type: 'literal', field: 'to', value: env.email.security }],
        actions: [{ type: 'forward', value: [env.email.forwardDestination] }],
      });

      yield* Cloudflare.Email.Rule('Postmaster', {
        zone: zone.zoneId,
        enabled: true, // Mailbox kept, as RFC 5321 requires.
        matchers: [{ type: 'literal', field: 'to', value: env.email.postmaster }],
        actions: [{ type: 'forward', value: [env.email.forwardDestination] }],
      });

      yield* Cloudflare.Email.Rule('Hostmaster', {
        zone: zone.zoneId,
        enabled: true, // Mailbox kept, as RFC 2142 defines.
        matchers: [{ type: 'literal', field: 'to', value: env.email.hostmaster }],
        actions: [{ type: 'forward', value: [env.email.forwardDestination] }],
      });

      yield* Cloudflare.Email.Rule('Webmaster', {
        zone: zone.zoneId,
        enabled: true, // Mailbox kept, as RFC 2142 defines.
        matchers: [{ type: 'literal', field: 'to', value: env.email.webmaster }],
        actions: [{ type: 'forward', value: [env.email.forwardDestination] }],
      });

      yield* Cloudflare.Email.Rule('DmarcReports', {
        zone: zone.zoneId,
        enabled: true, // Mailbox kept, as the DMARC record names it for RFC 7489 reports.
        matchers: [{ type: 'literal', field: 'to', value: env.email.dmarcReports }],
        actions: [{ type: 'forward', value: [env.email.forwardDestination] }],
      });

      yield* Cloudflare.Email.Rule('TlsReports', {
        zone: zone.zoneId,
        enabled: true, // Mailbox kept, as the TLS-RPT record names it for RFC 8460 reports.
        matchers: [{ type: 'literal', field: 'to', value: env.email.tlsReports }],
        actions: [{ type: 'forward', value: [env.email.forwardDestination] }],
      });

      yield* Cloudflare.Email.CatchAll('CatchAll', {
        zone: zone.zoneId,
        enabled: false, // Mail to unknown mailboxes rejected by Cloudflare, as RFC 5321 defines.
        actions: [{ type: 'drop' }],
      });

      yield* Cloudflare.Email.SendingSubdomain('EmailSending', {
        zoneId: zone.zoneId,
        name: env.zoneDomain,
        previewEnabled: true, // Sent messages previewed in Cloudflare's activity log for a week.
      });

      yield* Cloudflare.DNS.Record('Dmarc', {
        zoneId: zone.zoneId,
        name: '_dmarc',
        type: 'TXT',
        content: `v=DMARC1; p=reject; adkim=s; rua=mailto:${env.email.dmarcReports};`, // Mail failing SPF and DKIM rejected by receivers, as RFC 7489 defines.
      });

      yield* Cloudflare.Worker('MtaStsPolicy', {
        assets: './mta-sts', // MTA-STS policy served as a static file, as RFC 8461 defines.
        domain: `mta-sts.${env.zoneDomain}`, // Policy host named as RFC 8461 requires.
        workersDev: false, // Policy served on the MTA-STS hostname alone, as RFC 8461 defines.
      });

      yield* Cloudflare.DNS.Record('MtaSts', {
        zoneId: zone.zoneId,
        name: '_mta-sts',
        type: 'TXT',
        content: 'v=STSv1; id=20261017;', // MTA-STS policy announced to senders, as RFC 8461 defines.
      });

      yield* Cloudflare.DNS.Record('TlsRpt', {
        zoneId: zone.zoneId,
        name: '_smtp._tls',
        type: 'TXT',
        content: `v=TLSRPTv1; rua=mailto:${env.email.tlsReports};`, // TLS failures reported by senders, as RFC 8460 defines.
      });

      yield* Cloudflare.DNS.Record('CaaGoogleTrustServices', {
        zoneId: zone.zoneId,
        name: '@',
        type: 'CAA',
        content: { flags: 0, tag: 'issue', value: 'pki.goog; cansignhttpexchanges=yes' }, // Certificates issued by Google Trust Services, as RFC 8659 defines.
      });

      yield* Cloudflare.DNS.Record('CaaGoogleTrustServicesWildcard', {
        zoneId: zone.zoneId,
        name: '@',
        type: 'CAA',
        content: { flags: 0, tag: 'issuewild', value: 'pki.goog; cansignhttpexchanges=yes' }, // Wildcard certificates issued by Google Trust Services, as RFC 8659 defines.
      });

      yield* Cloudflare.DNS.Record('CaaLetsEncrypt', {
        zoneId: zone.zoneId,
        name: '@',
        type: 'CAA',
        content: { flags: 0, tag: 'issue', value: 'letsencrypt.org' }, // Certificates issued by Let's Encrypt, as RFC 8659 defines.
      });

      yield* Cloudflare.DNS.Record('CaaLetsEncryptWildcard', {
        zoneId: zone.zoneId,
        name: '@',
        type: 'CAA',
        content: { flags: 0, tag: 'issuewild', value: 'letsencrypt.org' }, // Wildcard certificates issued by Let's Encrypt, as RFC 8659 defines.
      });

      yield* Cloudflare.DNS.Record('CaaSslCom', {
        zoneId: zone.zoneId,
        name: '@',
        type: 'CAA',
        content: { flags: 0, tag: 'issue', value: 'ssl.com' }, // Certificates issued by SSL.com, as RFC 8659 defines.
      });

      yield* Cloudflare.DNS.Record('CaaSslComWildcard', {
        zoneId: zone.zoneId,
        name: '@',
        type: 'CAA',
        content: { flags: 0, tag: 'issuewild', value: 'ssl.com' }, // Wildcard certificates issued by SSL.com, as RFC 8659 defines.
      });

      yield* Cloudflare.DNS.Record('CaaSectigo', {
        zoneId: zone.zoneId,
        name: '@',
        type: 'CAA',
        content: { flags: 0, tag: 'issue', value: 'sectigo.com' }, // Certificates issued by Sectigo, as RFC 8659 defines.
      });

      yield* Cloudflare.DNS.Record('CaaSectigoWildcard', {
        zoneId: zone.zoneId,
        name: '@',
        type: 'CAA',
        content: { flags: 0, tag: 'issuewild', value: 'sectigo.com' }, // Wildcard certificates issued by Sectigo, as RFC 8659 defines.
      });

      yield* Cloudflare.DNS.Record('CaaIssueMail', {
        zoneId: zone.zoneId,
        name: '@',
        type: 'CAA',
        content: { flags: 0, tag: 'issuemail', value: ';' }, // S/MIME certificates refused to every authority, as RFC 9495 defines.
      });

      yield* Cloudflare.DNS.Record('CaaIssueVmc', {
        zoneId: zone.zoneId,
        name: '@',
        type: 'CAA',
        content: { flags: 0, tag: 'issuevmc', value: ';' }, // BIMI certificates refused to every authority, as the BIMI Group defines.
      });

      yield* Cloudflare.Ssl.UniversalSsl('UniversalSsl', {
        zoneId: zone.zoneId,
        enabled: true, // Certificates for the apex and first-level subdomains issued by Cloudflare.
      });

      yield* Cloudflare.Ssl.CertificateTransparencyAlerting('CertificateTransparencyAlerting', {
        zoneId: zone.zoneId,
        enabled: true, // Every certificate issued for the zone reported by Cloudflare.
        emails: [env.email.security],
      });

      yield* Cloudflare.DNS.Record('Www', {
        zoneId: zone.zoneId,
        name: 'www',
        type: 'AAAA',
        content: '100::', // Requests answered by Cloudflare alone, as no origin exists.
        proxied: true, // Requests answered over IPv4 and IPv6 by Cloudflare.
      });

      yield* Cloudflare.Ruleset.Ruleset('Redirects', {
        zone,
        phase: 'http_request_dynamic_redirect',
        rules: [
          {
            description: 'www to apex',
            enabled: true, // Redirect applied by Cloudflare.
            expression: 'http.request.full_uri wildcard r"https://www.*"',
            action: 'redirect',
            actionParameters: {
              fromValue: {
                targetUrl: {
                  expression:
                    'wildcard_replace(http.request.full_uri, r"https://www.*", r"https://${1}")', // Path and query string carried over to the apex.
                },
                statusCode: 308, // Permanent redirect keeping the method, as RFC 9110 defines.
              },
            },
          },
        ],
      });

      yield* Cloudflare.Zone.Setting('Ssl', {
        zoneId: zone.zoneId,
        settingId: 'ssl',
        value: 'strict', // Origin certificates verified by Cloudflare.
      });

      yield* Cloudflare.Zone.Setting('MinimumTlsVersion', {
        zoneId: zone.zoneId,
        settingId: 'min_tls_version',
        value: '1.2', // TLS 1.0 and 1.1 refused by Cloudflare, as RFC 8996 deprecates them.
      });

      yield* Cloudflare.Zone.Setting('Tls13', {
        zoneId: zone.zoneId,
        settingId: 'tls_1_3',
        value: 'on', // TLS 1.3 preferred by Cloudflare, as RFC 9325 requires.
      });

      yield* Cloudflare.Zone.Setting('Tls12Only', {
        zoneId: zone.zoneId,
        settingId: 'tls_1_2_only',
        value: 'off', // TLS 1.3 kept alongside TLS 1.2, as RFC 9325 requires.
      });

      yield* Cloudflare.Zone.Setting('ZeroRtt', {
        zoneId: zone.zoneId,
        settingId: '0rtt',
        value: 'off', // Early data refused by Cloudflare, as RFC 8446 leaves it open to replay.
      });

      yield* Cloudflare.Zone.Setting('AlwaysUseHttps', {
        zoneId: zone.zoneId,
        settingId: 'always_use_https',
        value: 'on', // HTTP requests redirected to HTTPS by Cloudflare.
      });

      yield* Cloudflare.Zone.Setting('OpportunisticEncryption', {
        zoneId: zone.zoneId,
        settingId: 'opportunistic_encryption',
        value: 'off', // HTTP requests redirected to HTTPS by Cloudflare instead.
      });

      yield* Cloudflare.Zone.Setting('SecurityHeader', {
        zoneId: zone.zoneId,
        settingId: 'security_header',
        value: {
          strict_transport_security: {
            enabled: true, // HTTPS enforced by browsers, as RFC 9325 recommends.
            max_age: 63072000, // HTTPS remembered by browsers for two years, as RFC 6797 defines.
            include_subdomains: true, // HTTPS enforced on every subdomain alike, as RFC 6797 defines.
            preload: true, // Preload list joined through hstspreload.org, beyond RFC 6797.
            nosniff: false, // Content type header set by the website instead.
          },
        },
      });

      yield* Cloudflare.Zone.Setting('Ipv6', {
        zoneId: zone.zoneId,
        settingId: 'ipv6',
        value: 'on', // IPv6 served by Cloudflare alongside IPv4, as RFC 8200 defines.
      });

      yield* Cloudflare.Zone.Setting('Http2', {
        zoneId: zone.zoneId,
        settingId: 'http2',
        value: 'on', // HTTP/2 served by Cloudflare, as RFC 9113 defines.
      });

      yield* Cloudflare.Zone.Setting('Http3', {
        zoneId: zone.zoneId,
        settingId: 'http3',
        value: 'on', // HTTP/3 served by Cloudflare, as RFC 9114 defines.
      });

      yield* Cloudflare.Zone.Setting('WebSockets', {
        zoneId: zone.zoneId,
        settingId: 'websockets',
        value: 'on', // WebSocket connections passed through by Cloudflare, as RFC 6455 defines.
      });

      yield* Cloudflare.Zone.Setting('EarlyHints', {
        zoneId: zone.zoneId,
        settingId: 'early_hints',
        value: 'on', // Link headers set by the website sent early, as RFC 8297 defines.
      });

      yield* Cloudflare.Zone.Setting('OpportunisticOnion', {
        zoneId: zone.zoneId,
        settingId: 'opportunistic_onion',
        value: 'on', // Tor visitors served over Cloudflare's onion service.
      });

      yield* Cloudflare.UrlNormalization.UrlNormalization('UrlNormalization', {
        zoneId: zone.zoneId,
        scope: 'incoming', // URLs normalized for rule matching only, never rewritten for the origin.
        type: 'rfc3986', // URLs normalized as RFC 3986 defines, without Cloudflare's extras.
      });

      yield* Cloudflare.Zone.Setting('BrowserCheck', {
        zoneId: zone.zoneId,
        settingId: 'browser_check',
        value: 'on', // Requests with suspicious headers challenged by Cloudflare.
      });

      yield* Cloudflare.Zone.Setting('SecurityLevel', {
        zoneId: zone.zoneId,
        settingId: 'security_level',
        value: 'medium', // Visitors with a poor IP reputation challenged by Cloudflare.
      });

      yield* Cloudflare.Zone.Setting('ChallengeTtl', {
        zoneId: zone.zoneId,
        settingId: 'challenge_ttl',
        value: 1800, // Passed challenges remembered by Cloudflare for half an hour.
      });

      yield* Cloudflare.BotManagement.BotManagement('Bots', {
        zoneId: zone.zoneId,
        aiSearch: 'disabled', // AI search crawlers let through by Cloudflare.
        aiUser: 'disabled', // AI agents let through by Cloudflare.
        aiTraining: 'disabled', // AI training crawlers let through by Cloudflare.
        crawlerProtection: 'disabled', // HTML served as shipped, untouched by Cloudflare.
        contentBotsProtection: 'disabled', // Content bots let through by Cloudflare.
        botPreferenceSyncEnabled: false, // robots.txt left to the website instead.
        cfRobotsVariant: 'off', // Content signals left to the website instead.
        enableJs: false, // HTML served as shipped, untouched by Cloudflare.
        fightMode: false, // Automated traffic let through by Cloudflare unchallenged.
      });

      yield* Cloudflare.SecurityTxt.SecurityTxt('SecurityTxt', {
        zoneId: zone.zoneId,
        enabled: true, // File served at /.well-known/security.txt by Cloudflare.
        contact: [`mailto:${env.email.security}`], // Vulnerabilities reported to the security mailbox, as RFC 9116 defines.
        expires: '2027-10-16T00:00:00Z', // Renewed within a year, as RFC 9116 recommends.
        canonical: [`https://${env.zoneDomain}/.well-known/security.txt`], // File location stated, as RFC 9116 defines.
        preferredLanguages: 'en', // Reports read in English.
      });

      yield* Cloudflare.Zone.Setting('AutomaticHttpsRewrites', {
        zoneId: zone.zoneId,
        settingId: 'automatic_https_rewrites',
        value: 'off', // HTML served as shipped, untouched by Cloudflare.
      });

      yield* Cloudflare.Zone.Setting('EmailObfuscation', {
        zoneId: zone.zoneId,
        settingId: 'email_obfuscation',
        value: 'off', // HTML served as shipped, untouched by Cloudflare.
      });

      yield* Cloudflare.Zone.Setting('RocketLoader', {
        zoneId: zone.zoneId,
        settingId: 'rocket_loader',
        value: 'off', // Scripts run as shipped, untouched by Cloudflare.
      });

      yield* Cloudflare.Zone.Setting('ReplaceInsecureJs', {
        zoneId: zone.zoneId,
        settingId: 'replace_insecure_js',
        value: 'on', // Compromised script libraries replaced by Cloudflare.
      });

      yield* Cloudflare.Zone.Setting('HotlinkProtection', {
        zoneId: zone.zoneId,
        settingId: 'hotlink_protection',
        value: 'off', // Assets embedded anywhere, unchecked by Cloudflare.
      });

      yield* Cloudflare.Zone.Setting('Fonts', {
        zoneId: zone.zoneId,
        settingId: 'fonts',
        value: 'off', // HTML served as shipped, untouched by Cloudflare.
      });

      yield* Cloudflare.Zone.Setting('SpeedBrain', {
        zoneId: zone.zoneId,
        settingId: 'speed_brain',
        value: 'on', // Likely next pages prefetched by browsers.
      });

      yield* Cloudflare.Zone.Setting('RedirectsForAiTraining', {
        zoneId: zone.zoneId,
        settingId: 'redirects_for_ai_training',
        value: 'off', // AI training crawlers served the requested URL as is.
      });

      yield* Cloudflare.ManagedTransforms.ManagedTransforms('ManagedTransforms', {
        zoneId: zone.zoneId,
        responseHeaders: {
          add_security_headers: false, // Security headers set by the website instead.
        },
      });

      yield* Cloudflare.Zone.Setting('BrowserCacheTtl', {
        zoneId: zone.zoneId,
        settingId: 'browser_cache_ttl',
        value: 0, // Cache headers set by the website instead.
      });

      yield* Cloudflare.Zone.Setting('Nel', {
        zoneId: zone.zoneId,
        settingId: 'nel',
        value: { enabled: true }, // Network errors reported to Cloudflare by browsers.
      });

      yield* Cloudflare.Rum.Site('WebAnalytics', {
        zoneTag: zone.zoneId,
        autoInstall: true, // Cookieless measurement script injected by Cloudflare.
        enabled: true, // Visits measured by Cloudflare.
        lite: false, // Visitors measured everywhere, the EU included.
      });
    }).pipe(Alchemy.RemovalPolicy.retain()); // Every resource kept by Cloudflare when the stack is destroyed.
  }),
);
