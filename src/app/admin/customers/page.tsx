
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: Timestamp;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchCustomers = async () => {
        setLoading(true);
        try {
          const querySnapshot = await getDocs(collection(db, "customers"));
          const customersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
          setCustomers(customersData);
        } catch (error) {
          console.error("Error fetching customers: ", error);
        } finally {
          setLoading(false);
        }
      };

      fetchCustomers();
    }, []);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Clientes</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Correo Electrónico</TableHead>
                            <TableHead className="hidden md:table-cell">Fecha de Registro</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            {/* You might not have a photoURL for customers yet */}
                                            {/* <AvatarImage src="/avatars/01.png" alt="Avatar" /> */}
                                            <AvatarFallback>
                                                {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-0.5">
                                            <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{customer.email}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {customer.createdAt ? format(customer.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
