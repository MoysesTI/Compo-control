import React, { useState, useEffect } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  OutlinedInput, 
  Box, 
  Chip, 
  Checkbox, 
  ListItemText, 
  Typography,
  Avatar,
  CircularProgress
} from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

/**
 * Member selector component for assigning users to cards/boards
 * 
 * @param {Object} props
 * @param {Array} props.value - Array of selected member IDs
 * @param {Function} props.onChange - Callback when selection changes
 * @param {boolean} props.disabled - Whether the selector is disabled
 * @param {string} props.label - Label for the select input
 * @param {Array} props.members - Array of members (optional, will fetch if not provided)
 */
export default function MemberSelector({ 
  value = [], 
  onChange, 
  disabled = false,
  label = "Membros",
  members = null
}) {
  const [teamMembers, setTeamMembers] = useState(members || []);
  const [loading, setLoading] = useState(!members);

  // Fetch team members if not provided
  useEffect(() => {
    if (!members) {
      const fetchTeamMembers = async () => {
        try {
          setLoading(true);
          const usersRef = collection(db, "users");
          const usersSnapshot = await getDocs(usersRef);
          const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTeamMembers(usersData);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching team members:", error);
          setLoading(false);
        }
      };
      
      fetchTeamMembers();
    }
  }, [members]);

  // Handle selection change
  const handleChange = (event) => {
    const { value } = event.target;
    onChange(value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography variant="body2">Carregando membros...</Typography>
      </Box>
    );
  }

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel id="member-selector-label">{label}</InputLabel>
      <Select
        labelId="member-selector-label"
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => {
              const member = teamMembers.find(m => m.id === value);
              return (
                <Chip 
                  key={value} 
                  label={member ? member.name : 'Unknown'} 
                  size="small" 
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {member ? member.name.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                  }
                />
              );
            })}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {teamMembers.map((member) => (
          <MenuItem key={member.id} value={member.id}>
            <Checkbox checked={value.indexOf(member.id) > -1} />
            <ListItemText 
              primary={member.name} 
              secondary={member.email}
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}