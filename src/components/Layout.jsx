import { Box, Flex, Stack, Icon, Text } from '@chakra-ui/react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { FiHome, FiDollarSign, FiPackage, FiPieChart } from 'react-icons/fi'

const NavItem = ({ icon, children, to }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? 'gray.100' : 'transparent'}
        color={isActive ? 'blue.500' : 'gray.600'}
        _hover={{
          bg: 'gray.100',
          color: 'blue.500',
        }}
      >
        <Icon
          mr="4"
          fontSize="16"
          as={icon}
        />
        <Text fontSize="md" fontWeight={isActive ? 'bold' : 'normal'}>
          {children}
        </Text>
      </Flex>
    </Link>
  )
}

const Layout = () => {
  return (
    <Flex minH="100vh">
      <Box
        w="64"
        bg="white"
        borderRight="1px"
        borderRightColor="gray.200"
      >
        <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
          <Text fontSize="2xl" fontWeight="bold" color="blue.500">
            Chirinos
          </Text>
        </Flex>
        <Stack spacing={0} mt={8}>
          <NavItem icon={FiHome} to="/">Dashboard</NavItem>
          <NavItem icon={FiDollarSign} to="/ventas">Ventas</NavItem>
          <NavItem icon={FiPackage} to="/inventario">Inventario</NavItem>
          <NavItem icon={FiPieChart} to="/reportes">Reportes</NavItem>
        </Stack>
      </Box>
      <Box flex="1" p="8" bg="gray.50">
        <Outlet />
      </Box>
    </Flex>
  )
}

export default Layout 