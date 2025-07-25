import React from 'react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-gray-700 mb-4">
                Al acceder y utilizar esta aplicación de gestión de ventas y comisiones, usted acepta estar sujeto a estos términos y condiciones de uso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Descripción del Servicio</h2>
              <p className="text-gray-700 mb-4">
                Esta aplicación proporciona herramientas para la gestión de ventas, seguimiento de comisiones, análisis de métricas financieras y sincronización con sistemas externos como QuickBooks.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Uso Aceptable</h2>
              <p className="text-gray-700 mb-4">
                Usted se compromete a utilizar la aplicación únicamente para fines legítimos y de acuerdo con estos términos. Está prohibido el uso de la aplicación para actividades ilegales o fraudulentas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Privacidad y Datos</h2>
              <p className="text-gray-700 mb-4">
                Su privacidad es importante para nosotros. Consulte nuestra Política de Privacidad para obtener información sobre cómo recopilamos, utilizamos y protegemos su información personal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Limitación de Responsabilidad</h2>
              <p className="text-gray-700 mb-4">
                En la máxima medida permitida por la ley, no seremos responsables de daños indirectos, incidentales, especiales o consecuentes que surjan del uso de esta aplicación.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Modificaciones</h2>
              <p className="text-gray-700 mb-4">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la aplicación.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Si tiene alguna pregunta sobre estos términos y condiciones, puede contactarnos a través de la aplicación.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions; 