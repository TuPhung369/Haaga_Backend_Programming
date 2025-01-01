import { ReactNode, FC } from "react";

import { ScrollTop } from "../../components/ScrollTop";
import OLayout from "../../components/OLayout/layout";
import HiCheckbox from "../../components/HiCheckbox";
import "@hichat/hichat-ui/layout/DefaultLayout/index.scss";

import Content from "../Content";
import Footer from "../Footer";
import Background from "../Background";
import Sider from "../Sider";
import { Header } from "antd/es/layout/layout";

export interface IDefaultLayoutProps {
	renderSiderNode?: () => ReactNode;
	classNames?: {
		sider?: string;
		content?: string;
		footer?: string;
		header?: string;
	};
}

const DefaultLayout: FC<React.PropsWithChildren<IDefaultLayoutProps>> = ({
	children,
	renderSiderNode,
	classNames,
}) => {
	return (
		<OLayout className="hilios-layout">
			{renderSiderNode ? (
				renderSiderNode()
			) : (
				<Sider className={classNames?.sider} />
			)}
			<OLayout>
				<Header className={classNames?.header}>
					<div className="">Hello Hilios!</div>
				</Header>

				<Content className={classNames?.content}>
					{children}
					<HiCheckbox>Default Label</HiCheckbox>
					<HiCheckbox className="!text-red-900 !font-bold">
						Bold Label
					</HiCheckbox>
				</Content>
				<Background />
				<Footer className={classNames?.footer} />
			</OLayout>
			<ScrollTop />
		</OLayout>
	);
};

export default DefaultLayout;
