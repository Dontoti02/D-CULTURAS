
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const menSizes = [
  { size: 'S', chest: '91-96 cm', waist: '76-81 cm', hip: '91-96 cm' },
  { size: 'M', chest: '97-102 cm', waist: '82-87 cm', hip: '97-102 cm' },
  { size: 'L', chest: '103-108 cm', waist: '88-93 cm', hip: '103-108 cm' },
  { size: 'XL', chest: '109-114 cm', waist: '94-99 cm', hip: '109-114 cm' },
];

const womenSizes = [
  { size: 'S', chest: '86-89 cm', waist: '69-71 cm', hip: '94-97 cm' },
  { size: 'M', chest: '90-93 cm', waist: '72-75 cm', hip: '98-101 cm' },
  { size: 'L', chest: '94-97 cm', waist: '76-79 cm', hip: '102-105 cm' },
  { size: 'XL', chest: '98-102 cm', waist: '80-84 cm', hip: '106-110 cm' },
];

export default function SizeGuide() {
  return (
    <Tabs defaultValue="women" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="women">Damas</TabsTrigger>
        <TabsTrigger value="men">Caballeros</TabsTrigger>
      </TabsList>
      <TabsContent value="women">
        <h3 className="text-lg font-semibold mb-4 text-center">Guía de Tallas para Damas</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Talla</TableHead>
              <TableHead>Pecho</TableHead>
              <TableHead>Cintura</TableHead>
              <TableHead>Cadera</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {womenSizes.map((s) => (
              <TableRow key={s.size}>
                <TableCell className="font-medium">{s.size}</TableCell>
                <TableCell>{s.chest}</TableCell>
                <TableCell>{s.waist}</TableCell>
                <TableCell>{s.hip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
         <p className="text-xs text-muted-foreground mt-4">
            *Las medidas son aproximadas y pueden variar ligeramente.
        </p>
      </TabsContent>
      <TabsContent value="men">
         <h3 className="text-lg font-semibold mb-4 text-center">Guía de Tallas para Caballeros</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Talla</TableHead>
              <TableHead>Pecho</TableHead>
              <TableHead>Cintura</TableHead>
              <TableHead>Cadera</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menSizes.map((s) => (
              <TableRow key={s.size}>
                <TableCell className="font-medium">{s.size}</TableCell>
                <TableCell>{s.chest}</TableCell>
                <TableCell>{s.waist}</TableCell>
                <TableCell>{s.hip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-4">
            *Las medidas son aproximadas y pueden variar ligeramente.
        </p>
      </TabsContent>
    </Tabs>
  );
}
