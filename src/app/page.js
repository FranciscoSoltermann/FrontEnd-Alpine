// src/app/page.js
import { redirect } from 'next/navigation';

export default function HomePage() {
    // Esta función redirige al usuario automáticamente a /login
    redirect('/login');
}