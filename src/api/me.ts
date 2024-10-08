import axios from "./base"
import type { IMeInfo } from '@/types'

export const fetchMePageData = () => {
  return axios.get<IMeInfo, IMeInfo>('me_page')
}