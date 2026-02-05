 import { useParams, Link } from 'react-router-dom';
 import { useEffect, useState } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useStoreProducts, StoreProductWithCategory } from '@/hooks/useStoreProducts';
 import { StoreCategory as StoreCategoryType } from '@/hooks/useStoreCategories';
 import { ArrowLeft, Package, ShoppingCart, ExternalLink } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
 import logo from '@/assets/logo-nova-era-3d.png';
 
 export default function StoreCategory() {
   const { slug } = useParams<{ slug: string }>();
   const [category, setCategory] = useState<StoreCategoryType | null>(null);
   const [isLoadingCategory, setIsLoadingCategory] = useState(true);
   const [selectedProduct, setSelectedProduct] = useState<StoreProductWithCategory | null>(null);
   const [showModal, setShowModal] = useState(false);
 
   // Fetch category by slug
   useEffect(() => {
     async function fetchCategory() {
       if (!slug) return;
       setIsLoadingCategory(true);
       
       const { data, error } = await supabase
         .from('store_categories')
         .select('*')
         .eq('slug', slug)
         .eq('status', 'active')
         .single();
       
       if (error) {
         console.error('Error fetching category:', error);
         setCategory(null);
       } else {
         setCategory(data as StoreCategoryType);
       }
       setIsLoadingCategory(false);
     }
     
     fetchCategory();
   }, [slug]);
 
   const { products, isLoading: isLoadingProducts } = useStoreProducts(category?.id, true);
 
   const handleBuy = (product: StoreProductWithCategory) => {
     if (product.cta_url) {
       window.open(product.cta_url, '_blank', 'noopener,noreferrer');
     } else {
       setSelectedProduct(product);
       setShowModal(true);
     }
   };
 
   if (isLoadingCategory) {
     return (
       <div className="min-h-screen flex items-center justify-center auth-bg">
         <div className="auth-spotlight" />
         <div className="auth-ambient" />
         <div className="auth-noise" />
         <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
       </div>
     );
   }
 
   if (!category) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center auth-bg p-4">
         <div className="auth-spotlight" />
         <div className="auth-ambient" />
         <div className="auth-noise" />
         <div className="relative z-10 text-center">
           <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
           <h1 className="text-xl font-bold mb-2" style={{ color: 'hsl(220 25% 20%)' }}>
             Categoria não encontrada
           </h1>
           <p className="text-muted-foreground mb-6">
             A categoria que você procura não existe ou foi desativada.
           </p>
           <Link to="/">
             <Button variant="outline" className="gap-2">
               <ArrowLeft className="h-4 w-4" />
               Voltar para a Loja Nova Era
             </Button>
           </Link>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen auth-bg p-4 sm:p-6">
       <div className="auth-spotlight" />
       <div className="auth-ambient" />
       <div className="auth-noise" />
 
       <div className="max-w-4xl mx-auto relative z-10">
         {/* Header */}
         <div className="flex items-center gap-4 mb-8">
           <Link to="/">
             <img src={logo} alt="Nova Era" className="h-12 w-auto" />
           </Link>
         </div>
 
         {/* Back Link */}
         <Link 
           to="/"
           className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
         >
           <ArrowLeft className="h-4 w-4" />
           Voltar para a Loja Nova Era
         </Link>
 
         {/* Category Header */}
         <div className="mb-8">
           <div className="flex items-center gap-3 mb-2">
             <span className="text-3xl">{category.icon || '📦'}</span>
             <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(220 25% 15%)' }}>
               {category.name}
             </h1>
           </div>
           {category.description && (
             <p className="text-muted-foreground max-w-2xl">
               {category.description}
             </p>
           )}
         </div>
 
         {/* Products */}
         {isLoadingProducts ? (
           <div className="flex items-center justify-center py-12">
             <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
           </div>
         ) : products.length === 0 ? (
           <div className="p-8 rounded-xl bg-white/40 backdrop-blur-sm border border-white/60 text-center">
             <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
             <p className="text-muted-foreground">
               Ainda não há produtos nesta categoria.
             </p>
             <p className="text-sm text-muted-foreground/70 mt-1">
               Volte em breve ou explore outra categoria.
             </p>
           </div>
         ) : (
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {products.map((product) => (
               <div
                 key={product.id}
                 className="p-5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/70 
                            hover:bg-white/80 hover:shadow-lg transition-all duration-200"
               >
                 <h3 className="font-semibold mb-2" style={{ color: 'hsl(220 25% 15%)' }}>
                   {product.name}
                 </h3>
                 {product.short_description && (
                   <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                     {product.short_description}
                   </p>
                 )}
                 <div className="flex items-center justify-between mt-auto pt-2">
                   <span className="font-bold text-lg" style={{ color: 'hsl(220 25% 20%)' }}>
                     {product.price}
                   </span>
                   <Button
                     size="sm"
                     onClick={() => handleBuy(product)}
                     className="gap-2"
                   >
                     {product.cta_url ? (
                       <>
                         <ExternalLink className="h-4 w-4" />
                         Comprar
                       </>
                     ) : (
                       <>
                         <ShoppingCart className="h-4 w-4" />
                         Comprar
                       </>
                     )}
                   </Button>
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
 
       {/* Placeholder Modal */}
       <Dialog open={showModal} onOpenChange={setShowModal}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Comprar: {selectedProduct?.name}</DialogTitle>
             <DialogDescription>
               A integração de pagamento será configurada aqui futuramente.
             </DialogDescription>
           </DialogHeader>
           <div className="py-4 text-center">
             <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
             <p className="text-sm text-muted-foreground">
               Entre em contato conosco para finalizar sua compra.
             </p>
           </div>
           <Button onClick={() => setShowModal(false)} className="w-full">
             Entendido
           </Button>
         </DialogContent>
       </Dialog>
     </div>
   );
 }