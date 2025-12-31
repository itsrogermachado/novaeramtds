import { UserProfile } from '@/hooks/useAllUsers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from 'lucide-react';

interface UserSelectorProps {
  users: UserProfile[];
  selectedUserId: string | null;
  onSelectUser: (userId: string | null) => void;
  isLoading?: boolean;
}

export function UserSelector({ users, selectedUserId, onSelectUser, isLoading }: UserSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        <User className="h-4 w-4" />
        Usuário:
      </span>
      <Select 
        value={selectedUserId || 'all'} 
        onValueChange={(value) => onSelectUser(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione um usuário"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os usuários</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <span>{user.full_name || 'Usuário sem nome'}</span>
                {user.role === 'admin' && (
                  <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
