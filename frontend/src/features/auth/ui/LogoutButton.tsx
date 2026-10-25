import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui'
import { useSession } from '@/entities/session'

export function LogoutButton() {
  const signOut = useSession((s) => s.signOut)
  const navigate = useNavigate()
  return (
    <Button
      variant="ghost"
      className="px-3"
      onClick={() => {
        signOut()
        navigate('/login', { replace: true })
      }}
    >
      <LogOut size={16} /> <span className="hidden sm:inline">Выйти</span>
    </Button>
  )
}
