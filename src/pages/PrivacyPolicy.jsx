import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Información que Recopilamos</h2>
              <p className="text-gray-700 mb-4">
                Recopilamos información que usted nos proporciona directamente, como:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Información de contacto (nombre, email)</li>
                <li>Datos de ventas y transacciones</li>
                <li>Información de clientes y productos</li>
                <li>Datos de autenticación</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Cómo Utilizamos su Información</h2>
              <p className="text-gray-700 mb-4">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Proporcionar y mantener nuestros servicios</li>
                <li>Procesar transacciones y gestionar ventas</li>
                <li>Generar reportes y análisis</li>
                <li>Comunicarnos con usted sobre el servicio</li>
                <li>Mejorar nuestros servicios</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Compartir Información</h2>
              <p className="text-gray-700 mb-4">
                No vendemos, alquilamos ni compartimos su información personal con terceros, excepto:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Con su consentimiento explícito</li>
                <li>Para cumplir con obligaciones legales</li>
                <li>Con proveedores de servicios que nos ayudan a operar la aplicación</li>
                <li>Para sincronización con QuickBooks (si usted lo autoriza)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Seguridad de Datos</h2>
              <p className="text-gray-700 mb-4">
                Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Cookies y Tecnologías Similares</h2>
              <p className="text-gray-700 mb-4">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia en la aplicación, recordar sus preferencias y analizar el uso del servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Sus Derechos</h2>
              <p className="text-gray-700 mb-4">
                Usted tiene derecho a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Acceder a su información personal</li>
                <li>Corregir información inexacta</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Oponerse al procesamiento de sus datos</li>
                <li>Retirar su consentimiento en cualquier momento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Cambios a esta Política</h2>
              <p className="text-gray-700 mb-4">
                Podemos actualizar esta política de privacidad ocasionalmente. Le notificaremos sobre cualquier cambio significativo publicando la nueva política en la aplicación.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Si tiene preguntas sobre esta política de privacidad o nuestras prácticas de privacidad, puede contactarnos a través de la aplicación.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 