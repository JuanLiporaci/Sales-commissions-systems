import React from 'react';
import { Box, Text, Icon } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface StatCardProps {
  title: string;
  stat: string | number;
  icon: IconType;
  helpText?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, stat, icon, helpText }) => {
  return (
    <Box
      p={5}
      bg="white"
      rounded="lg"
      shadow="base"
      borderWidth="1px"
      borderColor="gray.100"
    >
      <Box display="flex" alignItems="center">
        <Box flexGrow={1}>
          <Text color="gray.500" fontSize="sm">
            {title}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="brand.primary">
            {stat}
          </Text>
        </Box>
        <Box>
          <Icon
            as={icon}
            w={8}
            h={8}
            color="brand.secondary"
          />
        </Box>
      </Box>
      {helpText && (
        <Text color="gray.500" fontSize="sm" mt={2}>
          {helpText}
        </Text>
      )}
    </Box>
  );
};

export default StatCard; 