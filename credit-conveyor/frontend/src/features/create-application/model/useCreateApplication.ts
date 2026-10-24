import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { applicationKeys, clientApplicationApi, type ApplicationCreate } from '@/entities/application'

/** Создать черновик и сразу отправить его в банк */
export function useCreateApplication() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async (data: ApplicationCreate) => {
      const draft = await clientApplicationApi.create(data)
      return clientApplicationApi.submit(draft.id)
    },
    onSuccess: (application) => {
      queryClient.setQueryData(applicationKeys.client(application.id), application)
      queryClient.invalidateQueries({ queryKey: applicationKeys.clientList })
      navigate(`/client/applications/${application.id}`)
    },
  })
}
