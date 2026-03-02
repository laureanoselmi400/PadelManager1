# 🎾 PadelManager

Sistema de gestión para canchas de pádel. Construido con **Next.js 14**, **TypeScript** y **Tailwind CSS**.
 asd
## Funcionalidades

### 👤 Contactos
- Alta, edición y eliminación de jugadores
- Datos: nombre, apellido, teléfono, fecha de nacimiento, email, categoría
- Filtro por categoría y búsqueda por texto

### 📅 Agenda
- **Generación de agendas**: definí rango de fechas, hora de inicio/fin y duración de cada turno
- **Vista semanal**: navegación por semana con indicadores de días con turnos
- **Reservas**: al hacer click en un turno podés:
  - Asignar un contacto existente (búsqueda por nombre/teléfono)
  - Crear un nuevo contacto y asignarlo al turno
- **Ver reserva**: al clickear un turno reservado se muestra el contacto con nombre, teléfono y categoría
- **Liberar turno**: permite deshacer una reserva
- Eliminar turnos libres de un día

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

## Stack

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + CSS Custom Properties
- **Storage**: localStorage (no requiere base de datos)
- **Fuentes**: Bebas Neue + DM Sans

## Estructura

```
padel-app/
├── app/
│   ├── layout.tsx        # Layout raíz con navegación
│   ├── page.tsx          # Redirect a /contactos
│   ├── globals.css       # Estilos globales y sistema de diseño
│   ├── contactos/
│   │   └── page.tsx      # CRUD de contactos
│   └── agenda/
│       └── page.tsx      # Gestión de turnos y reservas
├── components/
│   └── Navigation.tsx    # Barra de navegación lateral
└── lib/
    └── store.ts          # Lógica de datos (localStorage)
```
