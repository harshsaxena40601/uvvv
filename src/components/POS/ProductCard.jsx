import { Package } from "lucide-react";
import { currency } from "../../utils/currency";

export default function ProductCard({ product, rem, low, oos, onAdd }) {
  return (
    <button
      onClick={() => onAdd(product)}
      disabled={oos}
      className={`group relative rounded-2xl overflow-hidden border transition-all ${oos? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-70 cursor-not-allowed' : 'bg-white dark:bg-neutral-900 hover:shadow-lg border-neutral-200 dark:border-neutral-700 hover:border-orange-200'}`}
    >
      <div className="relative">
        <img src={product.img} alt={product.name} className="h-28 sm:h-32 w-full object-cover"/>
        {oos && (<div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white text-sm font-semibold">Out of Stock</span></div>)}
      </div>
      <div className="p-3 text-left">
        <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{product.name}</div>
        <div className="mt-1 font-bold text-lg text-orange-600">{currency(product.price)}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${oos? 'bg-red-100 text-red-700' : low? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}><Package className="h-3 w-3"/>{oos? 'Out of stock' : `${rem} left`}</span>
          <span className="text-xs text-neutral-400">#{product.sku}</span>
        </div>
      </div>
    </button>
  );
}
