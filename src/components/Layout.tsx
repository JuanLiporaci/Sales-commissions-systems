import React, { useState } from 'react';
import { Box, Flex, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, useDisclosure } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import { useAuth } from '../lib/AuthContext';
import Sidebar from './Sidebar';

/**
 * Componente Layout que envuelve las páginas privadas y proporciona la barra lateral
 * y estructura común para todas las vistas.
 */
const Layout = ({ children }: { children: React.ReactNode }) => {
  console.log('Layout rendering');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  console.log('Layout user:', user?.email);

  // Si no hay usuario, no renderizamos nada
  if (!user) {
    console.log('Layout: No user, returning null');
    return null;
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Sidebar - Visible en pantallas grandes */}
      <Box
        display={{ base: 'none', md: 'block' }}
        w="240px"
        bg="white"
        borderRight="1px"
        borderRightColor="gray.200"
        pos="fixed"
        h="full"
        shadow="md"
        zIndex={10}
        className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
      >
        <Sidebar currentPath={location.pathname} />
      </Box>

      {/* Drawer - Visible en pantallas pequeñas */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay>
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Menu</DrawerHeader>
            <DrawerBody>
              <Sidebar onClose={onClose} currentPath={location.pathname} />
            </DrawerBody>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>

      {/* Botón de menú - Visible en pantallas pequeñas */}
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
        position="fixed"
        top={4}
        left={4}
        zIndex={20}
        bg="white"
        shadow="md"
      />

      {/* Contenido principal */}
      <Box ml={{ base: 4, md: '260px' }} mr={4} mt={8} pb={8}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 