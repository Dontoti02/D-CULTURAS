import Link from 'next/link';
import { Shirt } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex flex-col items-start gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Shirt className="h-6 w-6 text-primary" />
              <span className="font-bold">Verano Style</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your destination for modern and stylish clothing.
            </p>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold">Shop</h3>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              Men
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              Women
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              New Arrivals
            </Link>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold">Support</h3>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              Contact Us
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              FAQ
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              Shipping & Returns
            </Link>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold">Legal</h3>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              Privacy Policy
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Verano Style. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
