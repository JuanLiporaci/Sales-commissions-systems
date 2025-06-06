import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/auth';
import { FcGoogle } from 'react-icons/fc';
import { BsEnvelope, BsLock, BsEye, BsEyeSlash, BsPerson, BsCardText } from 'react-icons/bs';
import { Container, Row, Col, Form, Button, Card, InputGroup, Alert } from 'react-bootstrap';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const SignUp = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    identificador: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Registrar en Auth
      const user = await register(form.email, form.password, form.fullName);
      // Guardar perfil en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        displayName: form.fullName,
        email: form.email,
        identificador: form.identificador || '',
        photoURL: '',
        admin: false,
        actualizado: new Date().toISOString()
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      width: '100%',
      backgroundColor: '#f8f9fa'
    }}>
      <Card style={{ maxWidth: '450px', width: '100%' }} className="border-0 shadow mx-3">
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="mb-3 d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 p-3 rounded-circle">
              <BsPerson className="fs-2 text-primary" />
            </div>
            <h2 className="fw-bold">Crear cuenta</h2>
            <p className="text-muted">Regístrate para comenzar</p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4 text-center">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre completo</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <BsPerson />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Tu nombre completo"
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <BsEnvelope />
                </InputGroup.Text>
                <Form.Control
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Tu email"
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <BsLock />
                </InputGroup.Text>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  required
                />
                <Button 
                  variant="light" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="border-start-0"
                >
                  {showPassword ? <BsEyeSlash /> : <BsEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Identificador <span className="text-muted">(opcional)</span></Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <BsCardText />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  name="identificador"
                  value={form.identificador}
                  onChange={handleChange}
                  placeholder="Ej: juan-liporaci, vendedor-01, etc."
                />
              </InputGroup>
              <Form.Text className="text-muted">
                Puedes dejarlo vacío y configurarlo luego en ajustes.
              </Form.Text>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100 py-2 mt-3"
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </Form>

          <div className="text-center mt-4">
            <p className="mb-0">
              ¿Ya tienes una cuenta?{' '}
              <a href="/login" className="text-primary text-decoration-none fw-semibold">
                Inicia sesión
              </a>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SignUp; 