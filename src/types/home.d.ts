export interface ISearchRecomment {
  value: number,
  label: string
}

export interface ISearchResultLits {
  list: ISearchResult[]
}

export interface ISearchResult {
  type: number,
  label: string,
  resultCount: number
}

export interface IHomeInfo {
  banner: IBanner[],
  searchRecomments: ISearchRecomment[],
  transformer: ITransformer[],
  scrollBarInfoList: IScrollBarInfo[]
  countdown: ICountDown,
  activities: string[]
}

export interface IBanner {
  imgUrl: string
}

export interface ITransformer {
  imgUrl: string,
  label: string
}

export interface IScrollBarInfo {
  type: string,
  badge: string,
  detail: string,
  btn: string
}

export interface ICountDown {
  time: number,
  goods: IGood
}