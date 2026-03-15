# 📖 Manual de Usuario - nfTables Simulator

¡Bienvenido al **Simulador Interactivo de nftables**! Esta herramienta está diseñada para que puedas practicar y visualizar cómo funciona un firewall Linux sin riesgo de romper un sistema de producción.

Este manual te guiará a través de la interfaz y las funcionalidades principales.

---

## 🌐 1. Topología de Red (El Diagrama Superior)

La parte superior de la aplicación muestra el escenario de red sobre el que vas a trabajar. Este escenario simula la infraestructura de una pequeña empresa:

*   **Router (Debian):** Es el corazón de la topología. Es el firewall perimetral donde "ejecutaremos" tus reglas de `nftables`. Tiene tres interfaces de red conectando las tres zonas.
*   **INTERNET (WAN - `eth0`):** Representa el exterior. Cualquier tráfico no seguro proviene de aquí.
*   **Zona DMZ (`eth1` - 192.168.200.0/24):** Zona Desmilitarizada. Aquí se encuentra el **Servidor Apache** (.200.2), que normalmente aloja servicios que deben ser accesibles desde fuera (como una web HTTP/HTTPS).
*   **Zona LAN (`eth2` - 192.168.100.0/24):** La red Local. Aquí están los ordenadores de los empleados locales:
    *   **Admin PC** (.100.50): El administrador, que puede necesitar accesos privilegiados (ej. SSH al router).
    *   **Empleado 1** (.100.2) y **Empleado 2** (.100.3): Usuarios de la red con necesidades de navegación estándar.

**💡 Tip Interactivo:** Puedes hacer clic sobre cualquiera de los iconos de los equipos (Router, Apache, Admin, Empleados o Internet) para desplegar un panel inferior con su información detallada: Dirección IP, Zona, Sistema Operativo y los servicios que tiene activos.

---

## 📝 2. Editor de Reglas nftables (Panel Inferior Izquierdo)

Aquí es donde escribes la configuración del firewall, simulando la línea de comandos de un servidor Linux.

1.  **Escribe tus reglas:** Usa la sintaxis estándar de `nftables` (`nft add table...`, `nft add rule...`).
2.  **Sintaxis y Comentarios:** Puedes usar `#` para escribir comentarios que te ayuden a organizar tu código.
3.  **Botón "Aplicar":** Una vez que hayas escrito tu conjunto de reglas, pulsa el botón verde **Aplicar**. Esto cargará tus reglas en el "Router virtual".
4.  **Botón "Limpiar":** Borra todo el contenido del editor para empezar de cero.

---

## 🧪 3. Test de Paquetes (Panel Inferior Central)

Una vez que tus reglas están aplicadas en el Router, necesitas probar si funcionan como esperas. Usa este panel para "disparar" paquetes de red y comprobar el comportamiento del firewall.

1.  **Origen:** Selecciona desde dónde se origina la conexión (ej. un ordenador de la LAN, o un atacante desde Internet).
2.  **Destino:** Selecciona hacia qué equipo va dirigido el paquete.
3.  **Protocolo:** Elige entre `TCP`, `UDP` o `ICMP` (ping).
4.  **Puerto Destino:** Si has elegido TCP o UDP, especifica a qué puerto quieres acceder. Puedes usar los botones rápidos para los puertos más comunes (`SSH:22`, `DNS:53`, `HTTP:80`, `HTTPS:443`) o escribir manualmente.
5.  **Estado Conexión:** Simula paquetes del connection tracking:
    *   `new`: Un intento de nueva conexión.
    *   `established`: Un paquete perteneciente a una conexión ya validada y permitida.
    *   `related`: Un paquete relacionado con una conexión existente.
6.  **Botón "🚀 Lanzar Paquete":** Ejecuta la prueba. El paquete saldrá del Origen, viajará hasta el Router, pasará por tus reglas de `nftables` y el resultado aparecerá en el **Log**.

---

## 📋 4. Log de Resultados (Panel Inferior Derecho)

Este panel monitoriza el resultado de todas las pruebas que realizas.

*   Cada vez que haces clic en "Lanzar Paquete" verás una nueva línea de registro.
*   **Indicadores visuales:**
    *   ✅ **ACCEPT** (Verde): El paquete ha sido permitido.
    *   🚫 **DROP** (Rojo): El paquete ha sido bloqueado/descartado.
    *   ❌ **REJECT** (Naranja): El paquete ha sido rechazado activamente.
*   **Información del Log:** Muestra la fecha/hora, el origen y destino, el protocolo/puerto, la cadena (`chain`) evaluada y la regla que matcheó (o la política por defecto que se aplicó).

---

## 📚 5. Referencia Rápida / Cheat Sheet (Panel Lateral Derecho)

¡No necesitas saberte todo de memoria! La barra lateral de la derecha es tu "chuleta" interactiva.

*   Contiene ejemplos de las configuraciones y reglas más habituales.
*   **Copiar y Pegar:** Haz clic sobre cualquier fragmento de código y se copiará automáticamente al portapapeles. Luego podrás pegarlo en el **Editor de Reglas**.
*   Puedes mostrar u ocultar este panel por completo haciendo clic en el botón **"Referencia"** en la barra de navegación principal.
