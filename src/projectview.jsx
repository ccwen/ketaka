var React=require("react");
var FileControls=React.createClass({
  render:function() {
    return <div><h1 className="header_text">Bambos</h1></div> 
  }
});
var FolderList = React.createClass({
  getInitialState:function() {
    return {selected:0};
  },
  shouldComponentUpdate:function(nextProps,nextState) {

    return (nextProps.folders!=this.props.folders ||
      this.state.selected!=nextState.selected || this.props.hits != nextProps.hits);
  },
  select:function(e) {
    var i=e.target.parentElement.attributes['data-i'].value;
    this.setState({selected:i});
    this.props.onSelectFolder(i);
  },
  renderFolders:function() { 
    var folders = [];
    if(this.props.folders != null) folders = this.props.folders.sort(); 
    var cls="",out=[];
    for (var i=0;i<this.props.folders.length;i++) {
      var f=this.props.folders[i];
      var hit="";
      if (this.props.hits&&this.props.hits[i]) hit=this.props.hits[i];
      if (i==this.state.selected) cls="success"; else cls="";
      out.push(<tr key={'d'+i} className={cls} onClick={this.select} data-i={i}>
        <td>{f}
        <span className="label label-info">{hit}</span>
        </td>
        </tr>);
    };
    return out;
  },

  render:function() {
    return <div className="folderList"> 
    <table className="table table-hover">
    <tbody>{this.renderFolders()}</tbody>
    </table>
    </div>;
  }
});
var FileList = React.createClass({
  getInitialState:function() {
    return {selected:0,hovered:-1};
  },
  select:function(e) {
    var ee=e.target.parentElement.attributes['data-i'];
    if (!ee) return;
    var selected=parseInt(ee.value);
    this.setState({selected:selected});
    this.props.onSelectFile(selected);
  },
  shouldComponentUpdate:function(nextProps,nextState) {

    var shouldUpdate= (nextState.hovered != this.state.hovered || this.state.hovered==-1
      ||nextState.selected!=this.state.selected || this.props.files!=nextProps.files);

    if (this.props.files!=nextProps.files) {
      if (nextProps.selected!=this.state.selected) {
        nextState.selected=nextProps.selected;
      }
    }
    return shouldUpdate;
  },
  leave:function(e) {
    this.setState({hovered:-1});
  },
  openfile:function(e) {
    var e=e.target;
    while (e) {
      if (e.attributes['data-i']) {
        var i=parseInt(e.attributes['data-i'].value);
        break;
      } else e=e.parentElement;
    }
    this.setState({selected:i});
    this.props.onOpenFile(i);
  },
  getSegNameInFile:function(i) {
      var segnames=this.props.kde.getFileSegNames(this.props.start+i);
      var start=segnames[0];
      var end=segnames[segnames.length-1];
      if (start=="_") {
        start=segnames[1]; //ignore empty starting page _
      }
      return {start:start,end: end}
  },  
  renderFiles:function() {
    var cls="",out=[], filestart=this.props.start;
    for (var i=0;i<this.props.files.length;i++) {
      var f=this.props.files[i],hit="";
      if (this.props.hits) hit=this.props.hits[filestart+i]?this.props.hits[filestart+i].length:"";
      if (!hit) hit="";
      if (i==this.state.selected) cls="success"; else cls="";
	  var segnames=this.getSegNameInFile(i);
      out.push(<tr key={'f'+i} onClick={this.select} 
           onMouseEnter={this.hoverFile} onMouseLeave={this.leave}
           className={cls} data-i={i}>
        <td onDoubleClick={this.openfile}>{f.substring(0,f.length-4)}
        
        <span className="label label-info">{hit}</span>
		<span>,Page:{segnames.start}-{segnames.end}</span>
        <span className="pull-right" style={{visibility:this.state.hovered==i?"":"hidden"}}>
        <button className="btn btn-success"  onClick={this.openfile}>Open</button>
        </span>
        </td>
        </tr>);
    };
    return out;
  }, 
  hoverFile:function(e) {
    if (e.target.parentElement.nodeName!='TR') return;
    var hovered=e.target.parentElement.attributes['data-i'].value;
    if (this.state.hovered==hovered) return;

    this.setState({hovered:hovered});
  },
  render:function() {
    return <div  className="fileList">
    <table className="table table-hover">
    <tbody>{this.renderFiles()}</tbody></table></div>;
  }
});
var projectview = React.createClass({
  getInitialState: function() {
    return {bar: "world",folders:[],files:[],selectedFile:0};
  },
  shouldComponentUpdate:function(nextProps,nextState) {
    return (nextProps.kde.activeQuery!=this.activeQuery || typeof this.activeQuery=="undefined"
      || nextState.files!=this.state.files|| nextState.folders!=this.state.folders);
  }, 
  autoopen:function() {
    //if (!this.props.autoopen || !this.props.autoopen.file) return;
    var folders=this.state.folders;
    if (this.props.autoopen && this.props.autoopen.file) {
        var folder=this.props.autoopen.file;
        folder=folder.substring(0,folder.lastIndexOf('/'));
        for(var i=0;i<folders.length;i++) {
          if (folders[i]==folder) {
            this.selectFolder(i);
            break;
          }
        }
    } else {
      if (!this.folderopen && this.state.folders.length) this.selectFolder( 0 ); 
      this.folderopen=true;
    }
  },
  componentDidMount:function() {
    var folders={};
    var filenames=this.props.kde.get("filenames");
    if (!filenames) {
      console.error("kde not loaded yet");
      return;
    } 
    filenames.map(function(f) { folders[f.substring(0,f.indexOf('/'))]=true});
    var _folders=Object.keys(folders);
    this.setState({folders:_folders});
    setTimeout( this.autoopen.bind(this),1); 
    if (this.props.tab ) this.props.tab.instance=this; // for tabui 
    this.activeQuery=this.props.kde.activeQuery;
  },
  selectFolder:function(i) {
    var folder=this.state.folders[i];
    var filenames=this.props.kde.get("filenames");

    var files=[],start;
    filenames.map(function(f,idx) {
      if(f.substring(0,folder.length)==folder) {
        if (!files.length) start=idx;
        files.push(f.substring(folder.length+1));
      }
    });

    this.setState({files:files, filestart:start, folder:folder,selectedFile:0});

    if (this.props.autoopen && this.props.autoopen.file) {
      for(var i=0;i<files.length;i++) {
        if (folder+'/'+files[i]==this.props.autoopen.file) {
          this.openFile(i);
          this.props.autoopen.file=""; //prevent from click on folder autoopen
          break;
        }
      }
    }
    this.props.kde.activeFolder=folder;
    this.props.action("selectfile",this.props.kde,folder);
  },
  selectFile:function(i) {
    var f=this.state.folder+'/'+this.state.files[i];
    this.props.kde.activeFile=f;
    this.props.action("selectfile",this.props.kde,f);
  },
  openFile:function(i) {
    var f=this.state.folder+'/'+this.state.files[i];
    var gotopageid;
    if (this.props.autoopen)  {
      gotopageid=this.props.autoopen.pageid;
    }
    this.props.action("openfile",this.props.kde.dbname,f,gotopageid,null);
    if (this.props.autoopen) {
      this.props.autoopen.pageid="";
    }
    this.setState({selectedFile:i});
  },
  
  makescrollable:function() {
    var tabheight=this.getDOMNode().getBoundingClientRect().height;
    var f=this.refs.folderList.getDOMNode();
    f.style.height=document.body.offsetHeight-130+"px";
    //f.style.height='90%';//tabheight-f.getBoundingClientRect().top;
//    f.style.height=document.body.offsetHeight/2-f.getBoundingClientRect().top;
    f=this.refs.fileList.getDOMNode();
//    f.style.height=document.body.offsetHeight/2-f.getBoundingClientRect().top;
    //f.style.height='90%';//f.style.height=tabheight- f.getBoundingClientRect().top;
    f.style.height=document.body.offsetHeight-130+"px";//f.style.height=tabheight- f.getBoundingClientRect().top;
  },
  componentDidUpdate:function() {
    this.activeQuery=this.props.kde.activeQuery;
    this.makescrollable();
    var that=this;
    if  (typeof this.state.folder=="undefined") {
        setTimeout(function(){
          that.selectFolder(0);
       },100);
    }
  },
  getFolderHits:function() {
    if (!this.props.kde.activeQuery) return [];
    return this.props.kde.activeQuery.byFolder;
  },
  getFileHits:function() {
    if (!this.props.kde.activeQuery) return [];
    return this.props.kde.activeQuery.byFile;
  },
  componentWillUnmount:function() {
    return;
    this.props.action("closedb",this.props.kde.kdbid);
  },
  render: function() {
    return (
      <div className="projectview">
        <div className="row">
        <div className="col-md-3">
        <div><h1 className="header_text">Volumes</h1></div> 
        <FolderList ref="folderList" folders={this.state.folders} onSelectFolder={this.selectFolder} hits={this.getFolderHits()} />
        </div>
        <div className="col-md-9">
        <FileControls/>
        <FileList ref="fileList" className="fileList" 
           selected={this.state.selectedFile} 
            files={this.state.files} 
			kde={this.props.kde}
            onSelectFile={this.selectFile} onOpenFile={this.openFile} start={this.state.filestart} hits={this.getFileHits()}/>
        </div>
        </div>
      </div>
    );   
  }
});
module.exports=projectview;