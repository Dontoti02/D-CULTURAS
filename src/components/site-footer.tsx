
import Link from 'next/link';
import Image from 'next/image';

export default function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex flex-col items-start gap-2">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
                <Image src="/assets/logo.png" alt="Diseñando Culturas Logo" width={140} height={35} className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Tu destino para ropa moderna con un toque de cultura y diseño.
            </p>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold">Tienda</h3>
            <Link href="/?gender=Caballeros" className="text-sm text-muted-foreground hover:text-primary">
              Hombres
            </Link>
            <Link href="/?gender=Damas" className="text-sm text-muted-foreground hover:text-primary">
              Mujeres
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
              Novedades
            </Link>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold">Soporte</h3>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
              Contáctanos
            </Link>
            <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary">
              Preguntas frecuentes
            </Link>
            <Link href="/shipping" className="text-sm text-muted-foreground hover:text-primary">
              Envíos y Devoluciones
            </Link>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold">Legal</h3>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
              Términos de Servicio
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
              Política de Privacidad
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Diseñando Culturas. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
