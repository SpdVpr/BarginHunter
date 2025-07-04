# 🏢 Bargain Hunter - Super Admin Dashboard

## 📊 Přehled systému

Super Admin Dashboard poskytuje kompletní přehled o všech shopech, revenue, usage statistikách a business metrics pro majitele aplikace.

## 🔐 Přístup a bezpečnost

### Nastavení admin uživatele

1. **Vytvoření prvního admin uživatele:**
```bash
POST /api/admin/setup
{
  "email": "your-email@domain.com",
  "setupKey": "setup-bargain-hunter-admin-2024"
}
```

2. **Přihlášení:**
- URL: `/api/admin/auth/login`
- Email: váš admin email
- Password: nastavte v `ADMIN_PASSWORD` env variable

### Environment Variables
```bash
ADMIN_JWT_SECRET=your-super-secret-admin-key
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_SETUP_KEY=setup-bargain-hunter-admin-2024
```

## 📈 Dashboard funkce

### 1. Overview Tab
- **Monthly Revenue**: Celkový měsíční příjem
- **Active Shops**: Počet aktivních shopů
- **Discount Codes**: Celkový počet vygenerovaných kódů
- **Plan Distribution**: Rozložení shopů podle plánů

### 2. Revenue Tab
- Revenue podle jednotlivých plánů
- Průměrný příjem na zákazníka
- Conversion rates mezi plány

### 3. Shops Tab
- Seznam všech shopů s detaily:
  - Shop domain
  - Současný plán
  - Status předplatného
  - Měsíční revenue
  - Počet vygenerovaných discount kódů
  - Datum poslední aktivity

### 4. Usage Tab
- Celkové usage statistiky
- Průměrné využití na shop
- Conversion rate (game sessions → discount codes)

## 🔧 API Endpoints

### Analytics
```bash
GET /api/admin/analytics
Headers: x-admin-email: admin@domain.com
```

### Shops Data
```bash
GET /api/admin/shops
Headers: x-admin-email: admin@domain.com
```

### Export Report
```bash
GET /api/admin/export/report
# Stáhne CSV report s kompletními daty
```

### Authentication
```bash
GET /api/admin/auth/check    # Kontrola autentifikace
POST /api/admin/auth/login   # Přihlášení
```

## 📊 Metriky a KPIs

### Revenue Metrics
- **Total Revenue**: Celkový příjem
- **Monthly Recurring Revenue (MRR)**: Měsíční opakující se příjem
- **Average Revenue Per User (ARPU)**: Průměrný příjem na uživatele
- **Revenue by Plan**: Rozložení příjmů podle plánů

### Customer Metrics
- **Total Shops**: Celkový počet shopů
- **Active Shops**: Aktivní shopy (s platným předplatným)
- **Churn Rate**: Míra odchodu zákazníků
- **Plan Distribution**: Rozložení zákazníků podle plánů

### Usage Metrics
- **Total Game Sessions**: Celkový počet herních relací
- **Total Discount Codes**: Celkový počet vygenerovaných kódů
- **Conversion Rate**: Poměr sessions → discount codes
- **Average Usage per Shop**: Průměrné využití na shop

### Growth Metrics
- **New Shops**: Nové shopy za období
- **Upgrade Rate**: Míra upgradů mezi plány
- **Feature Adoption**: Adopce jednotlivých funkcí

## 🛠️ Databázová struktura

### Admin Analytics Collection
```typescript
interface AdminAnalyticsDocument {
  date: string; // YYYY-MM-DD
  metrics: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    totalShops: number;
    activeShops: number;
    planDistribution: {
      free: number;
      starter: number;
      pro: number;
      enterprise: number;
    };
    totalGameSessions: number;
    totalDiscountCodes: number;
    averageDiscountCodesPerShop: number;
  };
  planMetrics: {
    [planId: string]: {
      count: number;
      revenue: number;
      averageUsage: number;
      churnRate: number;
    };
  };
}
```

### Admin Users Collection
```typescript
interface AdminUserDocument {
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  permissions: {
    viewAnalytics: boolean;
    manageShops: boolean;
    manageBilling: boolean;
    viewSupport: boolean;
    systemAdmin: boolean;
  };
  isActive: boolean;
}
```

## 🔄 Automatické generování analytics

Analytics se generují automaticky:
- **Denně**: Kompletní business metrics
- **Real-time**: Při každém API volání se aktualizují data
- **On-demand**: Možnost manuálního přegenerování

```typescript
// Generování analytics
await AdminAnalyticsService.generateDailyAnalytics();

// Získání nejnovějších analytics
const analytics = await AdminAnalyticsService.getLatestAnalytics();
```

## 📋 Export a reporting

### CSV Export
- Kompletní business report
- Revenue breakdown
- Shop listing s detaily
- Usage statistics
- Plan distribution

### Dostupné reporty
1. **Daily Business Report**: Denní přehled všech metrik
2. **Revenue Report**: Detailní analýza příjmů
3. **Usage Report**: Analýza využití aplikace
4. **Customer Report**: Analýza zákaznické báze

## 🔒 Bezpečnostní opatření

### Autentifikace
- JWT tokeny s 24h expirací
- Secure HTTP-only cookies
- Role-based access control

### Oprávnění
- **super_admin**: Plný přístup ke všemu
- **admin**: Základní admin funkce
- **support**: Pouze podpora zákazníků

### Audit Log
- Všechny admin akce jsou logovány
- Tracking přihlášení a aktivit
- Monitoring neautorizovaných pokusů

## 🚀 Nasazení

### 1. Nastavení environment variables
```bash
ADMIN_JWT_SECRET=your-super-secret-admin-key-min-32-chars
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_SETUP_KEY=setup-bargain-hunter-admin-2024
```

### 2. Vytvoření admin uživatele
```bash
curl -X POST https://your-app.vercel.app/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "setupKey": "setup-bargain-hunter-admin-2024"
  }'
```

### 3. Přístup k dashboardu
- URL: `https://your-app.vercel.app/admin/dashboard`
- Login: `https://your-app.vercel.app/api/admin/auth/login`

## 📱 Mobile responsivní

Dashboard je plně responzivní a funguje na:
- Desktop počítačích
- Tabletech
- Mobilních telefonech

## 🔧 Maintenance

### Pravidelné úkoly
- **Denně**: Kontrola analytics generování
- **Týdně**: Review security logs
- **Měsíčně**: Backup admin dat
- **Kvartálně**: Security audit

### Monitoring
- Uptime monitoring
- Error rate tracking
- Performance metrics
- Security alerts

## 📞 Support

Pro technické problémy s admin dashboardem:
1. Zkontrolujte logs v `/api/admin/*` endpoints
2. Ověřte environment variables
3. Zkontrolujte Firebase permissions
4. Review admin user permissions

## 🔮 Budoucí vylepšení

### Plánované funkce
- Real-time dashboard updates
- Advanced filtering a search
- Custom date ranges
- Automated alerts
- Advanced reporting
- Multi-admin support
- API rate limiting
- Advanced security features
