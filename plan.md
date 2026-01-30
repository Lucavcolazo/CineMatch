Plan: Perfil con card de identidad (Lanyard) y modales

Estado actual





[app/(app)/profile/page.tsx](app/(app)/profile/page.tsx): página de perfil (Server Component) con bloque "Información del usuario" (AvatarSection + ProfileNameForm inline), dos cards (vistas / estadísticas) y preferencias.



AvatarSection ([components/profile/AvatarSection.tsx](components/profile/AvatarSection.tsx)): muestra avatar (foto o icono+color) y botón "Elegir icono y color" que abre AvatarIconModal.



ProfileNameForm ([components/profile/ProfileNameForm.tsx](components/profile/ProfileNameForm.tsx)): formulario inline (input + Guardar).



AvatarIconModal ([components/profile/AvatarIconModal.tsx](components/profile/AvatarIconModal.tsx)): modal ya existente para elegir icono y color.

No hay componente Lanyard ni dependencias de React Three Fiber / Rapier / meshline en el proyecto.



1. Layout de perfil (dos columnas)





Izquierda:  





Bloque "Cambiar datos" con dos botones: "Nombre" y "Icono y color". Cada uno abre un modal (no formularios inline).  



Bloque "Películas y series vistas" con enlace "Ver películas/series vistas" (como está ahora).  



Bloque "Estadísticas" con enlace "Ver estadísticas" (como está ahora).  



Mantener Preferencias debajo o en la misma columna, según diseño actual.



Derecha: componente Lanyard (card 3D colgada). En la tarjeta debemos mostrar: foto de perfil / icono, nombre por debajo centrado y abajo una frase (que se podrá elegir de un banco de frases a implementar).

La página sigue siendo Server Component; la parte con Lanyard y modales debe vivir en un Client Component que reciba los datos del perfil (displayName, avatarIcon, avatarColor, etc.) como props.



2. Modales para "Cambiar datos"





Modal "Nombre":  





Crear un modal con el mismo patrón que AvatarIconModal (overlay fijo, aria-modal, cierre con Escape y clic fuera).  



Contenido del modal: ProfileNameForm (mismo componente actual). Al guardar, cerrar el modal y refrescar (el formulario ya hace router.refresh()).



Modal "Icono y color":  





Reutilizar AvatarIconModal. En la columna izquierda, un botón "Icono y color" que abra este modal.  



El estado modalOpen y el botón que hoy están en AvatarSection pasan a este nuevo layout; AvatarSection puede quedar solo para mostrar el avatar (por ejemplo en la columna derecha junto a la card) o eliminarse si la identidad se muestra solo en/ junto al Lanyard.

Resultado: en "Cambiar datos" solo dos botones; ningún formulario ni selector de avatar visible fuera de los modales.



3. Integración del componente Lanyard

El código del Lanyard que proporcionaste usa Vite (imports de .glb y .png). En Next.js hay que adaptar:





Dependencias a instalar:
@react-three/fiber, @react-three/drei, @react-three/rapier, meshline.
El proyecto ya tiene three y gsap.



Render solo en cliente:
El Lanyard usa <Canvas> de React Three Fiber y física (Rapier). Debe montarse solo en el cliente:  





Crear un componente cliente, por ejemplo components/profile/LanyardCard.tsx, que contenga el código del Lanyard (o importe un subcomponente que use Canvas).  



En la página de perfil, importar ese componente con next/dynamic y ssr: false para evitar errores de SSR con Three/Rapier.



Assets en Next.js:  





No usar import cardGLB from './card.glb' (típico de Vite).  



Colocar card.glb y lanyard.png en public/ (por ejemplo public/lanyard/card.glb y public/lanyard/lanyard.png).  



En el componente: useGLTF('/lanyard/card.glb') y para la textura del cordón useTexture('/lanyard/lanyard.png') (o la API equivalente de drei).  



Los assets hay que descargarlos manualmente del repo de React Bits (por ejemplo DavidHDev/react-bits, carpeta src/assets/lanyard) y copiarlos a public/lanyard/. Si no están en esa ruta, buscar en el repo la ubicación real de los archivos del componente Lanyard.



Tipos:  





Añadir en global.d.ts (o en un .d.ts que TypeScript incluya):
declare module '*.glb';, declare module '*.png'; y el bloque declare module 'meshline' con MeshLineGeometry y MeshLineMaterial, más el IntrinsicElements para meshLineGeometry y meshLineMaterial si el código usa JSX de meshline.  



En Next.js no se usa vite.config.js; no hace falta assetsInclude para .glb si todo se carga por URL desde public/.



Extensión de Three (meshline):
Mantener extend({ MeshLineGeometry, MeshLineMaterial }) en el componente que use el Canvas, como en tu código.



4. Estructura de archivos sugerida





app/(app)/profile/page.tsx
Sigue siendo Server Component: obtiene usuario, perfil, preferencias y watchedCount. Renderiza un layout de dos columnas y pasa props a un único Client Component que agrupa izquierda + derecha.



components/profile/ProfileLayoutClient.tsx (nuevo, Client Component)  





Recibe: displayName, userEmail, avatarUrl, avatarIcon, avatarColor, watchedCount, y lo necesario para preferencias si se mantienen en esta vista.  



Izquierda: "Cambiar datos" (botones Nombre / Icono y color), "Películas y series vistas", "Estadísticas", y preferencias si aplica.  



Derecha: <LanyardCard /> (y opcionalmente nombre/slogan).  



Estado local: nameModalOpen, iconModalOpen.  



Modal Nombre: contiene <ProfileNameForm initialDisplayName={displayName} /> y cierre al guardar (el form ya hace refresh).  



Modal Icono y color: <AvatarIconModal ... /> con las mismas props que hoy (isOpen, onClose, currentIcon, currentColor, onSave).



components/profile/LanyardCard.tsx (nuevo, Client Component)  





Código del Lanyard adaptado: Canvas, física, Band, uso de useGLTF('/lanyard/card.glb') y useTexture('/lanyard/lanyard.png').
Visualización en la tarjeta: Foto de perfil/icono, nombre centrado y frase (del banco de frases).  



Props opcionales: position, gravity, fov, transparent como en tu ejemplo.  



Contenedor con altura/ancho fijos para que la card no ocupe toda la pantalla (por ejemplo un div con h-[400px] o similar y el Canvas al 100%).



components/profile/ProfileNameModal.tsx (nuevo, Client Component)  





Modal reutilizando el estilo de AvatarIconModal.  



Contenido: <ProfileNameForm initialDisplayName={...} />.  



Al montar el form dentro del modal, no hace falta cambiar ProfileNameForm; solo cerrar el modal después de guardar (por ejemplo escuchando el evento "profile-updated" o pasando un callback onSuccess que cierre el modal).



Assets:  





public/lanyard/card.glb  



public/lanyard/lanyard.png
Documentar en README o en comentarios que deben descargarse del repo React Bits (src/assets/lanyard o la ruta que corresponda).



global.d.ts (o types/global.d.ts):
Declaraciones para *.glb, *.png y meshline (y JSX de meshline si aplica).



5. Flujo de datos (resumen)

flowchart LR
  Page[profile/page.tsx Server]
  Client[ProfileLayoutClient]
  NameModal[ProfileNameModal]
  IconModal[AvatarIconModal]
  Lanyard[LanyardCard]
  Page --> Client
  Client --> NameModal
  Client --> IconModal
  Client --> Lanyard
  NameModal --> ProfileNameForm



6. Orden sugerido de implementación





Tipos y assets: Crear global.d.ts con los declare module y colocar card.glb y lanyard.png en public/lanyard/ (descargados del repo).



Dependencias: Instalar @react-three/fiber, @react-three/drei, @react-three/rapier, meshline.



LanyardCard: Crear LanyardCard.tsx con el Lanyard adaptado a rutas de public/ y asegurar que solo se renderiza en cliente (o importación dinámica con ssr: false desde el padre).



ProfileNameModal: Crear modal que envuelve ProfileNameForm y cerrar al guardar.



ProfileLayoutClient: Implementar layout dos columnas, botones "Nombre" e "Icono y color", inclusión de ProfileNameModal y AvatarIconModal, y en la derecha LanyardCard (+ nombre/slogan si se desea).



profile/page.tsx: Reducir el contenido a la obtención de datos y render de ProfileLayoutClient con las props necesarias; quitar el bloque actual "Información del usuario" y reemplazarlo por el nuevo layout.



7. Notas





AvatarSection: Si la identidad (avatar + nombre) se muestra en la columna derecha junto a la card, se puede extraer solo la parte de visualización (avatar + nombre) a un componente pequeño y ponerlo debajo o al lado del Lanyard; los botones "Nombre" e "Icono y color" quedan solo en la izquierda y abren los modales.  



card.glb / lanyard.png: Si en el repo de React Bits no están en src/assets/lanyard, habrá que localizar la ruta exacta en el repo o usar assets placeholder hasta tener los definitivos.  



Preferencias: Se mantienen en la página; pueden ir en la columna izquierda debajo de los dos bloques de enlaces o en una fila ancha bajo las dos columnas.

