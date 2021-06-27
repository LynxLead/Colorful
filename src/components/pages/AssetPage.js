import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

export const AssetPage = (props) => {
  return (
    <div>
      in asset page
    </div>
  )
}

AssetPage.propTypes = {
  props: PropTypes
}

const mapStateToProps = (state) => ({
  
})

const mapDispatchToProps = {
  
}

export default connect(mapStateToProps, mapDispatchToProps)(AssetPage)
