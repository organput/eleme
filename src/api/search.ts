import axios from "./base"
import type { ISearchResult, ISearchResultLits } from "@/types"

export function fetchSearchData(key = '') {
  return axios.get<ISearchResult, ISearchResultLits>('home_search', {
    params: { _label_like: key }
  })
}