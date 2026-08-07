import type { Product } from "../types";

const buildProducts = (): Product[] => {
  const now = new Date();
  const daysAgo = (days: number, hours: number = 0) =>
    new Date(now.getTime() - (days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000));

  return [
    {
      id: "jaqueta-jeans-feminina",
      name: "Jaqueta jeans oversized feminina",
      description: "Lavagem vintage, corte amplo e acabamento impecavel para compor camadas.",
      price: 149.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=editorial%20fashion%20photography%20of%20a%20vintage%20oversized%20blue%20denim%20jacket%20on%20a%20minimal%20neutral%20studio%20background%2C%20soft%20daylight%2C%20premium%20ecommerce%20product%20shot%2C%20realistic%20fabric%20texture&image_size=portrait_4_3",
      category: "Jaquetas",
      size: "M",
      condition: "Excelente",
      sector: "Feminino",
      createdAt: daysAgo(0, 4),
      featured: true,
      isNew: true
    },
    {
      id: "vestido-midi-terracota",
      name: "Vestido midi terracota",
      description: "Silhueta fluida, cintura marcada e toque leve para dias quentes.",
      price: 119.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20fashion%20product%20photo%20of%20a%20terracotta%20midi%20dress%20with%20soft%20fabric%20and%20elegant%20shape%20on%20a%20clean%20warm%20studio%20background%2C%20premium%20ecommerce%20lighting&image_size=portrait_4_3",
      category: "Vestidos",
      size: "P",
      condition: "Muito bom",
      sector: "Feminino",
      createdAt: daysAgo(1, 8),
      featured: true,
      isNew: true
    },
    {
      id: "camiseta-algodao-masc",
      name: "Camiseta de algodao oversized",
      description: "Peca essencial, corte amplo e visual clean para combinar com tudo.",
      price: 59.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=premium%20ecommerce%20photo%20of%20a%20plain%20white%20oversized%20cotton%20tshirt%20for%20men%2C%20soft%20studio%20light%2C%20minimal%20background%2C%20realistic%20detail&image_size=portrait_4_3",
      category: "Camisetas",
      size: "M",
      condition: "Muito bom",
      sector: "Masculino",
      createdAt: daysAgo(2, 3),
      isNew: true
    },
    {
      id: "vestido-infantil-floral",
      name: "Vestido infantil floral",
      description: "Vestido leve com tecido arejado, ideal para dias ensolarados.",
      price: 79.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=premium%20ecommerce%20photo%20of%20a%20cute%20little%20girl%20floral%20dress%20on%20a%20soft%20bright%20studio%20background%2C%20gentle%20lighting%2C%20kids%20fashion&image_size=portrait_4_3",
      category: "Vestidos",
      size: "8 anos",
      condition: "Muito bom",
      sector: "Infantil",
      createdAt: daysAgo(3, 12),
      isNew: true
    },
    {
      id: "bolsa-couro-vinho",
      name: "Bolsa couro vinho",
      description: "Acessorio marcante com estrutura firme e acabamento refinado.",
      price: 179.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=luxury%20ecommerce%20product%20photo%20of%20a%20burgundy%20leather%20handbag%20with%20structured%20shape%20on%20a%20soft%20neutral%20background%2C%20editorial%20lighting%2C%20realistic%20materials&image_size=portrait_4_3",
      category: "Acessorios",
      size: "Unico",
      condition: "Muito bom",
      sector: "Feminino",
      createdAt: daysAgo(5, 2),
      featured: true,
      isNew: true
    },
    {
      id: "blusa-linho-areia-fem",
      name: "Blusa de linho areia",
      description: "Essencial sofisticada para looks casuais com textura natural.",
      price: 79.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=high-end%20ecommerce%20photo%20of%20a%20beige%20linen%20shirt%20carefully%20styled%20on%20a%20soft%20light%20background%2C%20minimal%20fashion%20editorial%2C%20realistic%20texture&image_size=portrait_4_3",
      category: "Blusas",
      size: "G",
      condition: "Excelente",
      sector: "Feminino",
      createdAt: daysAgo(6, 6)
    },
    {
      id: "saia-midi-xadrez",
      name: "Saia midi xadrez",
      description: "Corte midi, modelagem reta e estilo urbano para composicoes do dia a dia.",
      price: 89.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=premium%20ecommerce%20photo%20of%20a%20checkered%20midi%20skirt%20on%20a%20soft%20neutral%20background%2C%20minimal%20styling%2C%20realistic%20fabric%20detail&image_size=portrait_4_3",
      category: "Saias",
      size: "38",
      condition: "Excelente",
      sector: "Feminino",
      createdAt: daysAgo(8, 4)
    },
    {
      id: "tenis-retro-branco-fem",
      name: "Tenis retro branco",
      description: "Visual limpo com pegada vintage e conforto para o dia todo.",
      price: 139.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=clean%20fashion%20ecommerce%20photo%20of%20white%20retro%20sneakers%20on%20a%20minimal%20soft%20gray%20background%2C%20premium%20product%20lighting%2C%20realistic%20leather%20and%20rubber%20detail&image_size=portrait_4_3",
      category: "Calcados",
      size: "37",
      condition: "Bom",
      sector: "Feminino",
      createdAt: daysAgo(10, 2)
    },
    {
      id: "camisa-linho-masc",
      name: "Camisa de linho areia masculina",
      description: "Versatil para looks casuais ou sociais leves, com caimento impecavel.",
      price: 89.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=high-end%20ecommerce%20photo%20of%20a%20beige%20linen%20button%20shirt%20for%20men%20on%20a%20clean%20neutral%20background%2C%20minimal%20styling%2C%20realistic%20fabric&image_size=portrait_4_3",
      category: "Camisas",
      size: "G",
      condition: "Excelente",
      sector: "Masculino",
      createdAt: daysAgo(12, 1)
    },
    {
      id: "calca-alfaiataria-masc",
      name: "Calca alfaiataria preta masculina",
      description: "Caimento reto, modelagem clean e acabamento premium.",
      price: 99.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=studio%20fashion%20product%20photo%20of%20black%20tailored%20trousers%20for%20men%2C%20clean%20lines%20and%20luxury%20retail%20styling%2C%20neutral%20background%2C%20realistic%20fabric%20detail&image_size=portrait_4_3",
      category: "Calcas",
      size: "40",
      condition: "Excelente",
      sector: "Masculino",
      createdAt: daysAgo(15, 9)
    },
    {
      id: "bermuda-chino-masc",
      name: "Bermuda chino areia masculina",
      description: "Peca coringa para dias quentes, com caimento leve e versatil.",
      price: 74.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=premium%20ecommerce%20photo%20of%20a%20beige%20chino%20shorts%20for%20men%20on%20a%20soft%20neutral%20background%2C%20minimal%20styling%2C%20clean%20lines&image_size=portrait_4_3",
      category: "Bermudas",
      size: "38",
      condition: "Bom",
      sector: "Masculino",
      createdAt: daysAgo(18, 10)
    },
    {
      id: "jaqueta-couro-masc",
      name: "Jaqueta de couro marrom masculina",
      description: "Peca statement com patina natural e visual urbano.",
      price: 229.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=editorial%20fashion%20photo%20of%20a%20brown%20vintage%20leather%20jacket%20for%20men%20on%20a%20minimal%20neutral%20background%2C%20soft%20light%2C%20premium%20product%20shot&image_size=portrait_4_3",
      category: "Jaquetas",
      size: "G",
      condition: "Muito bom",
      sector: "Masculino",
      createdAt: daysAgo(22, 5),
      featured: true
    },
    {
      id: "conjunto-infantil-estampado",
      name: "Conjunto infantil estampado",
      description: "Conjunto divertido com malha macia para o dia a dia da crianca.",
      price: 69.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20premium%20ecommerce%20photo%20of%20a%20colorful%20kids%20clothing%20set%20with%20soft%20pastel%20prints%20on%20a%20bright%20clean%20background%2C%20soft%20studio%20lighting&image_size=portrait_4_3",
      category: "Conjuntos",
      size: "6 anos",
      condition: "Excelente",
      sector: "Infantil",
      createdAt: daysAgo(11, 14)
    },
    {
      id: "camiseta-infantil-tema",
      name: "Camiseta infantil personagens",
      description: "Estampa divertida e malha macia para a crianca brincar a vontade.",
      price: 44.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=premium%20ecommerce%20photo%20of%20a%20kids%20tshirt%20with%20cute%20cartoon%20prints%20on%20a%20clean%20soft%20background%2C%20bright%20colorful%20studio%20shot&image_size=portrait_4_3",
      category: "Camisetas",
      size: "4 anos",
      condition: "Bom",
      sector: "Infantil",
      createdAt: daysAgo(20, 6)
    },
    {
      id: "jaqueta-infantil-jeans",
      name: "Jaqueta jeans infantil",
      description: "Peca essencial para camadas leves e looks cheios de personalidade.",
      price: 89.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=premium%20ecommerce%20photo%20of%20a%20kids%20denim%20jacket%20on%20a%20soft%20neutral%20background%2C%20minimal%20styling%2C%20realistic%20fabric%20detail&image_size=portrait_4_3",
      category: "Jaquetas",
      size: "10 anos",
      condition: "Excelente",
      sector: "Infantil",
      createdAt: daysAgo(24, 3)
    },
    {
      id: "tenis-infantil-colorido",
      name: "Tenis infantil colorido",
      description: "Solado macio, design divertido e fechamento facil para a crianca.",
      price: 99.9,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=clean%20fashion%20ecommerce%20photo%20of%20colorful%20kids%20sneakers%20on%20a%20minimal%20bright%20studio%20background%2C%20premium%20product%20lighting%2C%20fun%20design&image_size=portrait_4_3",
      category: "Calcados",
      size: "28",
      condition: "Muito bom",
      sector: "Infantil",
      createdAt: daysAgo(14, 8),
      featured: true
    }
  ];
};

export const mockProducts: Product[] = buildProducts();
