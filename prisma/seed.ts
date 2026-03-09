import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Función para generar slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('🌱 Iniciando seed de Compusum...');

  // =====================
  // 1. CREAR USUARIO ADMIN
  // =====================
  const hashedPassword = await bcrypt.hash('Compusum2025!', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@compusum.com' },
    update: {},
    create: {
      name: 'Administrador Compusum',
      email: 'admin@compusum.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    },
  });
  console.log('✅ Usuario admin creado:', admin.email);

  // =====================
  // 2. CREAR CATEGORÍAS Y SUBCATEGORÍAS
  // =====================
  const categoriesData = [
    {
      name: 'Escolar',
      icon: '📚',
      description: 'Todo el material escolar que necesitas para el regreso a clases',
      subcategories: [
        { name: 'Crayones y Colores', icon: '🖍️' },
        { name: 'Cuadernos y Agendas', icon: '📓' },
        { name: 'Plastilinas', icon: '🎨' },
        { name: 'Loncheras', icon: '🎒' },
        { name: 'Útiles Varios', icon: '✏️' },
      ],
    },
    {
      name: 'Oficina',
      icon: '🏢',
      description: 'Suministros de oficina para empresas y profesionales',
      subcategories: [
        { name: 'Resmas y Papel', icon: '📄' },
        { name: 'Archivadores y Carpetas', icon: '📁' },
        { name: 'Adhesivos y Cintas', icon: '🔗' },
        { name: 'Marcadores y Resaltadores', icon: '🖊️' },
        { name: 'Bolígrafos y Lápices', icon: '✒️' },
      ],
    },
    {
      name: 'Arte y Manualidades',
      icon: '🎨',
      description: 'Materiales artísticos para creativos',
      subcategories: [
        { name: 'Acrílicos y Vinilos', icon: '🖌️' },
        { name: 'Marcadores Lettering', icon: '✍️' },
        { name: 'Papeles Especiales', icon: '📜' },
        { name: 'Pinceles y Herramientas', icon: '🔧' },
      ],
    },
    {
      name: 'Tecnología y Accesorios',
      icon: '💻',
      description: 'Accesorios tecnológicos para tu trabajo y hogar',
      subcategories: [
        { name: 'Teclados y Mouse', icon: '⌨️' },
        { name: 'Cables y Adaptadores', icon: '🔌' },
        { name: 'Pilas y Baterías', icon: '🔋' },
        { name: 'Memorias USB', icon: '💾' },
      ],
    },
    {
      name: 'Ergonomía y Organización',
      icon: '📐',
      description: 'Organiza tu espacio de trabajo',
      subcategories: [
        { name: 'Bases para Monitor', icon: '🖥️' },
        { name: 'Organizadores de Escritorio', icon: '🗃️' },
      ],
    },
  ];

  for (const catData of categoriesData) {
    const parent = await prisma.category.upsert({
      where: { slug: slugify(catData.name) },
      update: {},
      create: {
        name: catData.name,
        slug: slugify(catData.name),
        description: catData.description,
        icon: catData.icon,
        sortOrder: categoriesData.indexOf(catData),
        isActive: true,
      },
    });

    console.log(`✅ Categoría creada: ${parent.name}`);

    for (const subcat of catData.subcategories) {
      await prisma.category.upsert({
        where: { slug: slugify(subcat.name) },
        update: {},
        create: {
          name: subcat.name,
          slug: slugify(subcat.name),
          icon: subcat.icon,
          parentId: parent.id,
          sortOrder: catData.subcategories.indexOf(subcat),
          isActive: true,
        },
      });
    }
  }

  // =====================
  // 3. CREAR MARCAS
  // =====================
  const brandsData = [
    { name: 'Faber-Castell', website: 'https://www.faber-castell.com' },
    { name: 'Kores', website: 'https://www.kores.com' },
    { name: 'Legis', website: 'https://www.legis.com.co' },
    { name: 'Doricolor' },
    { name: 'Rapid' },
    { name: 'Tintas y Trazos' },
    { name: 'Panasonic', website: 'https://www.panasonic.com' },
    { name: 'Norma' },
    { name: 'Pelikan' },
    { name: 'Familia' },
    { name: 'Bic', website: 'https://www.bic.com' },
    { name: 'Maped' },
    { name: 'Staedtler' },
    { name: 'PaperMate' },
    { name: 'Pilot' },
  ];

  for (const brandData of brandsData) {
    await prisma.brand.upsert({
      where: { slug: slugify(brandData.name) },
      update: {},
      create: {
        name: brandData.name,
        slug: slugify(brandData.name),
        website: brandData.website || null,
        isActive: true,
        sortOrder: brandsData.indexOf(brandData),
      },
    });
  }
  console.log(`✅ ${brandsData.length} marcas creadas`);

  // =====================
  // 4. CREAR TEMPORADAS
  // =====================
  const currentYear = new Date().getFullYear();
  
  const seasonsData = [
    {
      name: 'Regreso a Clases',
      description: 'Todo lo que necesitas para el inicio del año escolar',
      colorHex: '#FF6A00',
      startDate: new Date(currentYear, 0, 1),
      endDate: new Date(currentYear, 2, 31),
    },
    {
      name: 'Día del Niño',
      description: 'Celebra a los más pequeños con los mejores regalos',
      colorHex: '#E89A00',
      startDate: new Date(currentYear, 3, 1),
      endDate: new Date(currentYear, 3, 30),
    },
    {
      name: 'Navidad',
      description: 'Artículos especiales para la temporada navideña',
      colorHex: '#C41E3A',
      startDate: new Date(currentYear, 10, 15),
      endDate: new Date(currentYear, 11, 31),
    },
  ];

  for (const seasonData of seasonsData) {
    await prisma.season.upsert({
      where: { slug: slugify(seasonData.name) },
      update: {},
      create: {
        name: seasonData.name,
        slug: slugify(seasonData.name),
        description: seasonData.description,
        colorHex: seasonData.colorHex,
        startDate: seasonData.startDate,
        endDate: seasonData.endDate,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${seasonsData.length} temporadas creadas`);

  // =====================
  // 5. CREAR BANNERS
  // =====================
  const bannersData = [
    {
      title: 'Regreso a Clases 2025',
      subtitle: 'Todo el material escolar al mejor precio mayorista',
      imageDesktop: '/images/banners/back-to-school.jpg',
      linkUrl: '/catalogo?categoria=escolar',
      linkText: 'Ver productos',
      position: 'hero',
      isActive: true,
      sortOrder: 0,
    },
    {
      title: 'Precios por Volumen',
      subtitle: 'Descuentos especiales para compras mayoristas',
      imageDesktop: '/images/banners/wholesale.jpg',
      linkUrl: '/mayoristas',
      linkText: 'Más información',
      position: 'hero',
      isActive: true,
      sortOrder: 1,
    },
    {
      title: 'Marcas Premium',
      subtitle: 'Distribuidores autorizados de las mejores marcas',
      imageDesktop: '/images/banners/brands.jpg',
      linkUrl: '/marcas',
      linkText: 'Ver marcas',
      position: 'promo',
      isActive: true,
      sortOrder: 0,
    },
  ];

  for (const banner of bannersData) {
    const existing = await prisma.banner.findFirst({ where: { title: banner.title } });
    if (!existing) {
      await prisma.banner.create({ data: banner });
    }
  }
  console.log('✅ Banners creados');

  // =====================
  // 6. CREAR CONFIGURACIONES
  // =====================
  const settingsData = [
    { key: 'store_name', value: 'Compusum', group: 'general', label: 'Nombre de la tienda' },
    { key: 'store_slogan', value: 'Tu papelería al por mayor', group: 'general', label: 'Slogan' },
    { key: 'store_phone', value: '606 333-5206', group: 'contact', label: 'Teléfono' },
    { key: 'store_address', value: 'Carrera 6 #24-14, Pereira, Risaralda', group: 'contact', label: 'Dirección' },
    { key: 'store_email', value: 'info@compusum.com', group: 'contact', label: 'Email' },
    { key: 'whatsapp_number', value: '576063335206', group: 'contact', label: 'WhatsApp' },
    { key: 'instagram', value: '@compusumsas', group: 'social', label: 'Instagram' },
    { key: 'facebook', value: 'Compusum S.A.S.', group: 'social', label: 'Facebook' },
    { key: 'shipping_info', value: 'Envíos a todo Colombia', group: 'shipping', label: 'Info de envíos' },
    { key: 'primary_color', value: '#0D4DAA', group: 'appearance', label: 'Color primario' },
    { key: 'secondary_color', value: '#6DA8FF', group: 'appearance', label: 'Color secundario' },
    { key: 'accent_color', value: '#E89A00', group: 'appearance', label: 'Color de acento' },
  ];

  for (const setting of settingsData) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log(`✅ ${settingsData.length} configuraciones creadas`);

  // =====================
  // 7. CREAR PRODUCTOS DE EJEMPLO
  // =====================
  const allCategories = await prisma.category.findMany({ where: { parentId: { not: null } } });
  const allBrands = await prisma.brand.findMany();

  const sampleProducts = [
    { name: 'Crayones Faber-Castell x12', category: 'Crayones y Colores', brand: 'Faber-Castell', price: 8500, wholesale: 6500, minQty: 12, sku: 'FC-CRAY-12', featured: true, isNew: true },
    { name: 'Crayones Faber-Castell x24', category: 'Crayones y Colores', brand: 'Faber-Castell', price: 15500, wholesale: 12000, minQty: 6, sku: 'FC-CRAY-24', featured: true },
    { name: 'Lápices de Colores Kores x12', category: 'Crayones y Colores', brand: 'Kores', price: 6500, wholesale: 5000, minQty: 12, sku: 'KOR-LAP-12' },
    { name: 'Marcadores Sharpie x12', category: 'Marcadores y Resaltadores', brand: 'PaperMate', price: 28000, wholesale: 22000, minQty: 6, sku: 'SH-MAR-12', featured: true },
    { name: 'Cuaderno Cuadriculado 100 Hojas', category: 'Cuadernos y Agendas', brand: 'Legis', price: 4500, wholesale: 3500, minQty: 24, sku: 'LEG-CUA-100' },
    { name: 'Cuaderno Espiral Norma 80 Hojas', category: 'Cuadernos y Agendas', brand: 'Norma', price: 3800, wholesale: 2800, minQty: 24, sku: 'NOR-ESP-80', isNew: true },
    { name: 'Plastilina Pelikan x12 Colores', category: 'Plastilinas', brand: 'Pelikan', price: 12000, wholesale: 9500, minQty: 12, sku: 'PEL-PLA-12' },
    { name: 'Bolígrafos Bic Cristal x50', category: 'Bolígrafos y Lápices', brand: 'Bic', price: 35000, wholesale: 28000, minQty: 5, sku: 'BIC-CRI-50', featured: true },
    { name: 'Resma Papel Carta 500 Hojas', category: 'Resmas y Papel', brand: 'Legis', price: 18000, wholesale: 15000, minQty: 10, sku: 'LEG-RES-500' },
    { name: 'Resma Papel Oficio 500 Hojas', category: 'Resmas y Papel', brand: 'Legis', price: 22000, wholesale: 18000, minQty: 10, sku: 'LEG-RES-OFI' },
    { name: 'Set Pinceles Maped x6', category: 'Pinceles y Herramientas', brand: 'Maped', price: 18500, wholesale: 14500, minQty: 6, sku: 'MAP-PIN-6', isNew: true },
    { name: 'Acrílicos Tintas y Trazos x12', category: 'Acrílicos y Vinilos', brand: 'Tintas y Trazos', price: 32000, wholesale: 25000, minQty: 6, sku: 'TT-ACR-12', featured: true },
    { name: 'Corrector Líquido Kores x12', category: 'Útiles Varios', brand: 'Kores', price: 15000, wholesale: 12000, minQty: 12, sku: 'KOR-COR-12' },
    { name: 'Cinta Adhesiva Transparente x6', category: 'Adhesivos y Cintas', brand: 'Doricolor', price: 12000, wholesale: 9500, minQty: 12, sku: 'DOR-CIN-6' },
    { name: 'Memoria USB 32GB Panasonic', category: 'Memorias USB', brand: 'Panasonic', price: 28000, wholesale: 22000, minQty: 10, sku: 'PAN-USB-32' },
    { name: 'Archivador de Palanca Legis', category: 'Archivadores y Carpetas', brand: 'Legis', price: 8500, wholesale: 6500, minQty: 12, sku: 'LEG-ARCH-PAL' },
    { name: 'Set Marcadores Lettering x8', category: 'Marcadores Lettering', brand: 'Faber-Castell', price: 25000, wholesale: 19500, minQty: 6, sku: 'FC-LET-8', isNew: true },
    { name: 'Pilas AA Panasonic x4', category: 'Pilas y Baterías', brand: 'Panasonic', price: 12000, wholesale: 9500, minQty: 12, sku: 'PAN-AA-4' },
    { name: 'Organizador de Escritorio 4 Gavetas', category: 'Organizadores de Escritorio', brand: 'Doricolor', price: 35000, wholesale: 28000, minQty: 4, sku: 'DOR-ORG-4' },
    { name: 'Mouse Inalámbrico Panasonic', category: 'Teclados y Mouse', brand: 'Panasonic', price: 45000, wholesale: 36000, minQty: 5, sku: 'PAN-MOU-WL', featured: true },
    { name: 'Lápiz Mecánico Pilot 0.5mm', category: 'Bolígrafos y Lápices', brand: 'Pilot', price: 8500, wholesale: 6500, minQty: 12, sku: 'PIL-LM-05' },
    { name: 'Resaltadores Stabilo x6', category: 'Marcadores y Resaltadores', brand: 'Staedtler', price: 18000, wholesale: 14000, minQty: 6, sku: 'STA-RES-6' },
    { name: 'Cuaderno Profesional Familia 200 Hojas', category: 'Cuadernos y Agendas', brand: 'Familia', price: 15000, wholesale: 12000, minQty: 12, sku: 'FAM-PRO-200', isNew: true },
    { name: 'Compás Estudiante Maped', category: 'Útiles Varios', brand: 'Maped', price: 9500, wholesale: 7500, minQty: 12, sku: 'MAP-COM-EST' },
  ];

  for (const productData of sampleProducts) {
    const category = allCategories.find(c => c.name === productData.category);
    const brand = allBrands.find(b => b.name === productData.brand);
    
    if (category && brand) {
      await prisma.product.upsert({
        where: { slug: slugify(productData.name) },
        update: {},
        create: {
          name: productData.name,
          slug: slugify(productData.name),
          sku: productData.sku,
          shortDescription: `${productData.name} - Calidad garantizada`,
          description: `${productData.name}. Producto de alta calidad de la marca ${productData.brand}. Ideal para uso escolar y de oficina.`,
          categoryId: category.id,
          brandId: brand.id,
          price: productData.price,
          wholesalePrice: productData.wholesale,
          minWholesaleQty: productData.minQty,
          stockStatus: 'disponible',
          isFeatured: productData.featured || false,
          isNew: productData.isNew || false,
          isActive: true,
        },
      });
    }
  }
  console.log(`✅ ${sampleProducts.length} productos de ejemplo creados`);

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
