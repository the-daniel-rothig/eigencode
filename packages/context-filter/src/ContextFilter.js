import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'lodash/isEqual';

const propTypes = {
  of: PropTypes.shape({
    Provider: PropTypes.object.isRequired,
    Consumer: PropTypes.object.isRequired,
  }).isRequired,
  to: PropTypes.shape({
    Provider: PropTypes.object.isRequired,
    Consumer: PropTypes.object.isRequired,
  }),
  map: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
}

class ContextFilterInner extends React.Component {
  constructor(props) {
    super(props)
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.children !== this.props.children ||
           nextProps.contextType !== this.props.contextType ||
           !isEqual(nextProps.value, this.props.value);
  }

  render() {
    const Context = this.props.contextType;
    return (
      <Context.Provider value={this.props.value}>
        {this.props.children}
      </Context.Provider>
    )
  }
}

const ContextFilter = ({of: ofContext, to: toContext, map, children}) => {
  const context = useContext(ofContext)
  const mappedValue = map(context);
  return <ContextFilterInner contextType={toContext || ofContext} value={mappedValue}>{children}</ContextFilterInner>

}

ContextFilter.propTypes = propTypes;

export default ContextFilter;
